/**
 * Agent Runner — executes a single agent's
 * tool loop.
 *
 * Based on patterns from:
 * claude-code-main/src/tools/AgentTool/runAgent.ts
 * claude-code-main/src/query.ts (queryLoop)
 * claude-code-main/src/services/tools/toolExecution.ts
 *
 * The core loop:
 * 1. Send messages + tools to LLM
 * 2. If LLM returns tool_use → execute tool
 * 3. Append tool result to messages
 * 4. Loop back to step 1
 * 5. If LLM returns end_turn → done
 */

import type {
  AgentDefinition,
  AgentInstance,
  LLMProvider,
  LLMToolSchema,
  Message,
  ToolCall,
  ToolDefinition,
  ToolUseContext,
} from "../types/index.js";
import { zodToJsonSchema } from "../utils/zodToJsonSchema.js";

export interface AgentRunnerConfig {
  llmProvider: LLMProvider;
  allTools: ToolDefinition[];
  maxTurns: number;
  defaultModel: string;
  onProgress?: (
    agentId: string,
    message: Message,
  ) => void;
}

export class AgentRunner {
  private config: AgentRunnerConfig;

  constructor(config: AgentRunnerConfig) {
    this.config = config;
  }

  /**
   * Run an agent to completion.
   *
   * Like runAgent.ts in the source:
   * 1. Build system prompt
   * 2. Resolve which tools agent can use
   * 3. Enter the query loop
   * 4. Return final result
   */
  async run(
    agent: AgentInstance,
    prompt: string,
  ): Promise<string> {
    agent.status = "running";

    // Resolve tools for this agent
    // (same as resolveAgentTools in
    //  agentToolUtils.ts)
    const agentTools = this.resolveTools(
      agent.definition,
    );

    // Convert tools to LLM schema format
    // (same as toolToAPISchema in utils/api.ts)
    const toolSchemas: LLMToolSchema[] =
      agentTools.map((t) => ({
        name: t.name,
        description: t.description,
        inputSchema: zodToJsonSchema(t.inputSchema),
      }));

    // Build initial messages
    const messages: Message[] = [
      { role: "user", content: prompt },
    ];

    const toolContext: ToolUseContext = {
      agentId: agent.id,
      cwd: process.cwd(),
    };

    // ── The Query Loop ──────────────────────
    // Same pattern as query.ts:queryLoop()
    let turnCount = 0;

    while (turnCount < this.config.maxTurns) {
      turnCount++;

      // Call LLM
      const response =
        await this.config.llmProvider.createMessage({
          model:
            agent.definition.model ??
            this.config.defaultModel,
          systemPrompt:
            agent.definition.systemPrompt,
          messages,
          tools: toolSchemas,
        });

      // Add assistant message to history
      const assistantMsg: Message = {
        role: "assistant",
        content: response.content,
        toolCalls: response.toolCalls,
      };
      messages.push(assistantMsg);

      this.config.onProgress?.(
        agent.id,
        assistantMsg,
      );

      // If no tool calls → agent is done
      if (
        response.stopReason !== "tool_use" ||
        !response.toolCalls?.length
      ) {
        agent.status = "completed";
        agent.result = response.content;
        agent.messages = messages;
        return response.content;
      }

      // Execute tool calls
      // (same pattern as
      //  toolOrchestration.ts:runTools)
      const toolResults = await this.executeTools(
        response.toolCalls,
        agentTools,
        toolContext,
      );

      // Add tool results to message history
      for (const result of toolResults) {
        messages.push(result);
        this.config.onProgress?.(
          agent.id,
          result,
        );
      }
    }

    // Max turns reached
    agent.status = "completed";
    agent.result =
      "Max turns reached. " +
      "Last response: " +
      messages[messages.length - 1]?.content;
    agent.messages = messages;
    return agent.result;
  }

  /**
   * Execute tool calls from the LLM response.
   *
   * Based on:
   * claude-code-main/src/services/tools/
   *   toolExecution.ts
   *
   * 1. Find the tool definition by name
   * 2. Validate input with Zod
   * 3. Execute the tool
   * 4. Return tool_result message
   */
  private async executeTools(
    toolCalls: ToolCall[],
    availableTools: ToolDefinition[],
    context: ToolUseContext,
  ): Promise<Message[]> {
    const results: Message[] = [];

    // Separate concurrent-safe and unsafe tools
    // (same as isConcurrencySafe pattern in
    //  Tool.ts)
    const safeCalls: {
      tc: ToolCall;
      tool: ToolDefinition;
    }[] = [];
    const unsafeCalls: {
      tc: ToolCall;
      tool: ToolDefinition;
    }[] = [];

    for (const tc of toolCalls) {
      const tool = availableTools.find(
        (t) => t.name === tc.name,
      );
      if (!tool) {
        results.push({
          role: "tool",
          content: `Tool "${tc.name}" not found`,
          toolCallId: tc.id,
        });
        continue;
      }

      if (tool.isConcurrencySafe) {
        safeCalls.push({ tc, tool });
      } else {
        unsafeCalls.push({ tc, tool });
      }
    }

    // Run safe tools in parallel
    if (safeCalls.length > 0) {
      const parallel = await Promise.all(
        safeCalls.map(({ tc, tool }) =>
          this.executeSingleTool(tc, tool, context),
        ),
      );
      results.push(...parallel);
    }

    // Run unsafe tools sequentially
    for (const { tc, tool } of unsafeCalls) {
      const result = await this.executeSingleTool(
        tc,
        tool,
        context,
      );
      results.push(result);
    }

    return results;
  }

  private async executeSingleTool(
    tc: ToolCall,
    tool: ToolDefinition,
    context: ToolUseContext,
  ): Promise<Message> {
    try {
      // Validate input with Zod
      // (same as inputSchema.safeParse in
      //  toolExecution.ts:615)
      const parsed =
        tool.inputSchema.safeParse(tc.input);

      if (!parsed.success) {
        return {
          role: "tool",
          content: `Validation error: ${parsed.error.message}`,
          toolCallId: tc.id,
        };
      }

      // Execute the tool
      const result = await tool.call(
        parsed.data,
        context,
      );

      const content = result.error
        ? `Error: ${result.error}\n${
            typeof result.data === "string"
              ? result.data
              : JSON.stringify(result.data)
          }`
        : typeof result.data === "string"
          ? result.data
          : JSON.stringify(result.data);

      return {
        role: "tool",
        content,
        toolCallId: tc.id,
      };
    } catch (err: any) {
      return {
        role: "tool",
        content: `Execution error: ${err.message}`,
        toolCallId: tc.id,
      };
    }
  }

  /**
   * Resolve which tools an agent can access.
   *
   * Based on:
   * claude-code-main/src/tools/AgentTool/
   *   agentToolUtils.ts (resolveAgentTools)
   *
   * ["*"] = all tools
   * ["bash", "file_read"] = specific tools
   * disallowedTools filters out from the result
   */
  private resolveTools(
    definition: AgentDefinition,
  ): ToolDefinition[] {
    let tools: ToolDefinition[];

    if (
      definition.tools.includes("*") ||
      definition.tools.length === 0
    ) {
      tools = [...this.config.allTools];
    } else {
      tools = this.config.allTools.filter((t) =>
        definition.tools.includes(t.name),
      );
    }

    // Filter out disallowed tools
    if (definition.disallowedTools?.length) {
      const denied = new Set(
        definition.disallowedTools,
      );
      tools = tools.filter(
        (t) => !denied.has(t.name),
      );
    }

    return tools;
  }
}
