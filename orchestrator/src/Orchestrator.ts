/**
 * Orchestrator — coordinates multiple agents.
 *
 * Based directly on:
 * claude-code-main/src/coordinator/coordinatorMode.ts
 * claude-code-main/src/QueryEngine.ts
 *
 * The orchestrator:
 * 1. Receives a user request
 * 2. Decides which agents to spawn
 * 3. Runs agents (parallel or sequential)
 * 4. Collects results via TaskNotifications
 * 5. Synthesizes a final response
 *
 * Key principle from the source code:
 * "Never delegate understanding."
 * The orchestrator must synthesize agent
 * results itself — not pass raw findings
 * from one agent to another.
 */

import { randomUUID } from "crypto";
import { AgentRunner } from "./agents/AgentRunner.js";
import type {
  AgentDefinition,
  AgentInstance,
  LLMProvider,
  LLMToolSchema,
  Message,
  OrchestratorConfig,
  Task,
  TaskNotification,
  ToolDefinition,
} from "./types/index.js";
import { zodToJsonSchema } from "./utils/zodToJsonSchema.js";

export class Orchestrator {
  private config: OrchestratorConfig;
  private llmProvider: LLMProvider;
  private agentRunner: AgentRunner;
  private agents: Map<string, AgentInstance> =
    new Map();
  private tasks: Map<string, Task> = new Map();
  private conversationHistory: Message[] = [];

  constructor(
    config: OrchestratorConfig,
    llmProvider: LLMProvider,
  ) {
    this.config = config;
    this.llmProvider = llmProvider;
    this.agentRunner = new AgentRunner({
      llmProvider,
      allTools: config.tools,
      maxTurns: config.maxTurnsPerAgent,
      defaultModel: config.defaultModel,
      onProgress: (agentId, msg) => {
        this.handleAgentProgress(agentId, msg);
      },
    });
  }

  // ─── Main Entry Point ─────────────────────

  /**
   * Process a user message through the
   * orchestrator. This is the equivalent of
   * QueryEngine.submitMessage() from the source.
   *
   * Flow:
   * 1. Add user message to history
   * 2. Build coordinator system prompt
   * 3. Send to LLM with agent-management tools
   * 4. If LLM spawns agents → run them
   * 5. Feed results back to LLM
   * 6. Return final response
   */
  async processMessage(
    userMessage: string,
  ): Promise<string> {
    // Add user message
    this.conversationHistory.push({
      role: "user",
      content: userMessage,
    });

    // Build coordinator system prompt
    // (same as getCoordinatorSystemPrompt())
    const systemPrompt =
      this.buildCoordinatorSystemPrompt();

    // Build coordinator tools
    // (spawn_agent, send_message, stop_agent)
    const coordinatorTools =
      this.getCoordinatorToolSchemas();

    // ── Coordinator Loop ────────────────────
    // Same pattern as query.ts queryLoop()
    let maxIterations = 20;

    while (maxIterations-- > 0) {
      const response =
        await this.llmProvider.createMessage({
          model: this.config.defaultModel,
          systemPrompt,
          messages: this.conversationHistory,
          tools: coordinatorTools,
        });

      // Add assistant response to history
      this.conversationHistory.push({
        role: "assistant",
        content: response.content,
        toolCalls: response.toolCalls,
      });

      // No tool calls → return response
      if (
        response.stopReason !== "tool_use" ||
        !response.toolCalls?.length
      ) {
        return response.content;
      }

      // Handle coordinator tool calls
      await this.handleCoordinatorToolCalls(
        response.toolCalls,
      );
    }

    return (
      "Orchestrator reached max iterations."
    );
  }

  // ─── Coordinator Tools ────────────────────

  /**
   * The coordinator's own tools for managing
   * agents. Based on:
   * - AgentTool (spawn agents)
   * - SendMessageTool (continue agents)
   * - TaskStopTool (stop agents)
   */
  private getCoordinatorToolSchemas(): LLMToolSchema[] {
    return [
      {
        name: "spawn_agent",
        description:
          "Spawn a new agent to handle a task. " +
          "Choose the right agent_type for the " +
          "task. Write a complete, self-contained " +
          "prompt — agents can't see your " +
          "conversation.\n\nAvailable types:\n" +
          this.config.agents
            .map(
              (a) =>
                `- ${a.agentType}: ${a.whenToUse}`,
            )
            .join("\n"),
        inputSchema: {
          type: "object",
          properties: {
            agent_type: {
              type: "string",
              description:
                "Which agent to spawn",
              enum: this.config.agents.map(
                (a) => a.agentType,
              ),
            },
            prompt: {
              type: "string",
              description:
                "Complete task description. " +
                "Include file paths, context, " +
                "and what 'done' looks like.",
            },
            description: {
              type: "string",
              description:
                "Short 3-5 word summary",
            },
            run_in_background: {
              type: "boolean",
              description:
                "Run async (default: false)",
            },
          },
          required: [
            "agent_type",
            "prompt",
            "description",
          ],
        },
      },
      {
        name: "send_message",
        description:
          "Send a follow-up message to a " +
          "running or completed agent. The " +
          "agent resumes with its full context.",
        inputSchema: {
          type: "object",
          properties: {
            agent_id: {
              type: "string",
              description: "Target agent ID",
            },
            message: {
              type: "string",
              description:
                "Follow-up instruction",
            },
          },
          required: ["agent_id", "message"],
        },
      },
      {
        name: "stop_agent",
        description: "Stop a running agent.",
        inputSchema: {
          type: "object",
          properties: {
            agent_id: {
              type: "string",
              description: "Agent ID to stop",
            },
          },
          required: ["agent_id"],
        },
      },
    ];
  }

  // ─── Tool Call Handling ────────────────────

  private async handleCoordinatorToolCalls(
    toolCalls: {
      id: string;
      name: string;
      input: unknown;
    }[],
  ): Promise<void> {
    // Separate background and foreground tasks
    const foreground: typeof toolCalls = [];
    const background: typeof toolCalls = [];

    for (const tc of toolCalls) {
      const input = tc.input as any;
      if (
        tc.name === "spawn_agent" &&
        input.run_in_background
      ) {
        background.push(tc);
      } else {
        foreground.push(tc);
      }
    }

    // Launch background agents (fire & forget)
    for (const tc of background) {
      this.spawnAgentBackground(tc);
    }

    // Process foreground calls
    // (parallel where possible, like the
    //  source does with isConcurrencySafe)
    const results = await Promise.all(
      foreground.map((tc) =>
        this.executeCoodinatorTool(tc),
      ),
    );

    // Add tool results to conversation
    for (const result of results) {
      this.conversationHistory.push(result);
    }
  }

  private async executeCoodinatorTool(tc: {
    id: string;
    name: string;
    input: unknown;
  }): Promise<Message> {
    const input = tc.input as any;

    switch (tc.name) {
      case "spawn_agent":
        return this.handleSpawnAgent(
          tc.id,
          input,
        );
      case "send_message":
        return this.handleSendMessage(
          tc.id,
          input,
        );
      case "stop_agent":
        return this.handleStopAgent(
          tc.id,
          input,
        );
      default:
        return {
          role: "tool",
          content: `Unknown tool: ${tc.name}`,
          toolCallId: tc.id,
        };
    }
  }

  // ─── Agent Management ─────────────────────

  /**
   * Spawn and run an agent (foreground).
   *
   * Based on AgentTool.call() in:
   * claude-code-main/src/tools/AgentTool/
   *   AgentTool.tsx
   */
  private async handleSpawnAgent(
    toolCallId: string,
    input: {
      agent_type: string;
      prompt: string;
      description: string;
    },
  ): Promise<Message> {
    const definition = this.config.agents.find(
      (a) => a.agentType === input.agent_type,
    );

    if (!definition) {
      return {
        role: "tool",
        content:
          `Agent type "${input.agent_type}" ` +
          `not found. Available: ` +
          this.config.agents
            .map((a) => a.agentType)
            .join(", "),
        toolCallId,
      };
    }

    const agent = this.createAgentInstance(
      definition,
    );

    // Create task tracking
    const task: Task = {
      id: randomUUID(),
      agentId: agent.id,
      description: input.description,
      status: "running",
      prompt: input.prompt,
      createdAt: Date.now(),
    };
    this.tasks.set(task.id, task);

    try {
      // Run the agent
      const result = await this.agentRunner.run(
        agent,
        input.prompt,
      );

      task.status = "completed";
      task.result = result;
      task.completedAt = Date.now();

      // Return TaskNotification format
      // (same XML as coordinatorMode.ts)
      const notification =
        this.formatTaskNotification({
          taskId: agent.id,
          agentId: agent.id,
          status: "completed",
          summary: `Agent "${input.description}" completed`,
          result,
        });

      return {
        role: "tool",
        content: notification,
        toolCallId,
      };
    } catch (err: any) {
      agent.status = "failed";
      agent.error = err.message;
      task.status = "failed";
      task.error = err.message;

      return {
        role: "tool",
        content: `Agent failed: ${err.message}`,
        toolCallId,
      };
    }
  }

  /**
   * Send follow-up message to existing agent.
   *
   * Based on SendMessageTool in:
   * claude-code-main/src/tools/SendMessageTool/
   */
  private async handleSendMessage(
    toolCallId: string,
    input: { agent_id: string; message: string },
  ): Promise<Message> {
    const agent = this.agents.get(
      input.agent_id,
    );
    if (!agent) {
      return {
        role: "tool",
        content:
          `Agent "${input.agent_id}" not found`,
        toolCallId,
      };
    }

    try {
      const result = await this.agentRunner.run(
        agent,
        input.message,
      );

      return {
        role: "tool",
        content: this.formatTaskNotification({
          taskId: agent.id,
          agentId: agent.id,
          status: "completed",
          summary: `Agent "${agent.definition.agentType}" responded`,
          result,
        }),
        toolCallId,
      };
    } catch (err: any) {
      return {
        role: "tool",
        content: `Agent error: ${err.message}`,
        toolCallId,
      };
    }
  }

  /**
   * Stop a running agent.
   *
   * Based on TaskStopTool in:
   * claude-code-main/src/tools/TaskStopTool/
   */
  private async handleStopAgent(
    toolCallId: string,
    input: { agent_id: string },
  ): Promise<Message> {
    const agent = this.agents.get(
      input.agent_id,
    );
    if (!agent) {
      return {
        role: "tool",
        content: `Agent not found`,
        toolCallId,
      };
    }

    agent.status = "stopped";
    return {
      role: "tool",
      content: `Agent "${agent.id}" stopped`,
      toolCallId,
    };
  }

  // ─── Background Agents ────────────────────

  /**
   * Spawn an agent in background.
   * Notifications arrive later as messages.
   */
  private spawnAgentBackground(tc: {
    id: string;
    name: string;
    input: unknown;
  }): void {
    const input = tc.input as any;
    const definition = this.config.agents.find(
      (a) => a.agentType === input.agent_type,
    );
    if (!definition) return;

    const agent =
      this.createAgentInstance(definition);

    // Add immediate tool result
    this.conversationHistory.push({
      role: "tool",
      content:
        `Agent "${input.description}" ` +
        `launched in background. ` +
        `ID: ${agent.id}`,
      toolCallId: tc.id,
    });

    // Run in background
    this.agentRunner
      .run(agent, input.prompt)
      .then((result) => {
        // Push notification to conversation
        // (same as <task-notification> in
        //  coordinatorMode.ts)
        this.conversationHistory.push({
          role: "user",
          content: this.formatTaskNotification({
            taskId: agent.id,
            agentId: agent.id,
            status: "completed",
            summary: `Agent "${input.description}" completed`,
            result,
          }),
        });
      })
      .catch((err) => {
        this.conversationHistory.push({
          role: "user",
          content: this.formatTaskNotification({
            taskId: agent.id,
            agentId: agent.id,
            status: "failed",
            summary: `Agent "${input.description}" failed: ${err.message}`,
          }),
        });
      });
  }

  // ─── Helpers ──────────────────────────────

  private createAgentInstance(
    definition: AgentDefinition,
  ): AgentInstance {
    const agent: AgentInstance = {
      id: randomUUID(),
      definition,
      status: "idle",
      messages: [],
      createdAt: Date.now(),
    };
    this.agents.set(agent.id, agent);
    return agent;
  }

  /**
   * Format task notification — same XML format
   * as coordinatorMode.ts uses.
   */
  private formatTaskNotification(
    notification: TaskNotification,
  ): string {
    return `<task-notification>
<task-id>${notification.taskId}</task-id>
<status>${notification.status}</status>
<summary>${notification.summary}</summary>
${notification.result ? `<result>${notification.result}</result>` : ""}
</task-notification>`;
  }

  /**
   * Build the coordinator system prompt.
   *
   * Directly based on
   * getCoordinatorSystemPrompt() from:
   * claude-code-main/src/coordinator/
   *   coordinatorMode.ts
   */
  private buildCoordinatorSystemPrompt(): string {
    const agentList = this.config.agents
      .map(
        (a) =>
          `- **${a.agentType}**: ${a.whenToUse}\n` +
          `  Tools: ${a.tools.join(", ")}`,
      )
      .join("\n");

    return `You are an orchestrator that coordinates multiple specialized agents.

## Your Role

You are a **coordinator**. Your job is to:
- Help the user achieve their goal
- Direct agents to research, implement, and verify
- Synthesize results and communicate with the user
- Answer questions directly when possible

## Available Agents

${agentList}

## Your Tools

- **spawn_agent** — Spawn a new agent
- **send_message** — Continue an existing agent
- **stop_agent** — Stop a running agent

## Task Workflow

| Phase          | Who        | Purpose |
|----------------|------------|---------|
| Research       | Agents     | Investigate, find files |
| Synthesis      | **You**    | Read findings, plan |
| Implementation | Agents     | Make changes |
| Verification   | Agents     | Test changes |

## Key Rules

1. **Never delegate understanding.**
   Read agent results. Synthesize them.
   Write specific prompts with file paths
   and line numbers.

2. **Agents can't see your conversation.**
   Every prompt must be self-contained.

3. **Parallelism is your superpower.**
   Launch independent agents concurrently.

4. **Read-only = parallel. Write = sequential.**

## Prompt Examples

Good:
  "Fix the null pointer in src/auth.ts:42.
   Add a null check before user.id access.
   If null, return 401. Commit."

Bad:
  "Based on your findings, fix the bug"
  (This delegates understanding!)`;
  }

  // ─── Progress Tracking ────────────────────

  private handleAgentProgress(
    agentId: string,
    message: Message,
  ): void {
    // Hook point for UI updates,
    // logging, metrics, etc.
  }

  // ─── Public Getters ───────────────────────

  getAgent(
    id: string,
  ): AgentInstance | undefined {
    return this.agents.get(id);
  }

  getAllAgents(): AgentInstance[] {
    return Array.from(this.agents.values());
  }

  getTask(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  getConversationHistory(): Message[] {
    return [...this.conversationHistory];
  }
}
