/**
 * Anthropic LLM Provider.
 *
 * Based on pattern from:
 * claude-code-main/src/services/api/claude.ts
 * claude-code-main/src/services/api/client.ts
 */

import Anthropic from "@anthropic-ai/sdk";
import type {
  LLMProvider,
  LLMRequest,
  LLMResponse,
  ToolCall,
} from "../types/index.js";

export class AnthropicProvider implements LLMProvider {
  private client: Anthropic;

  constructor(apiKey?: string) {
    this.client = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
    });
  }

  async createMessage(
    request: LLMRequest,
  ): Promise<LLMResponse> {
    const response =
      await this.client.messages.create({
        model: request.model,
        max_tokens: request.maxTokens ?? 4096,
        system: request.systemPrompt,
        messages: this.convertMessages(
          request.messages,
        ),
        tools: request.tools.map((t) => ({
          name: t.name,
          description: t.description,
          input_schema:
            t.inputSchema as Anthropic.Tool.InputSchema,
        })),
        ...(request.temperature !== undefined && {
          temperature: request.temperature,
        }),
      });

    return this.parseResponse(response);
  }

  private convertMessages(
    messages: LLMRequest["messages"],
  ): Anthropic.MessageParam[] {
    return messages
      .filter((m) => m.role !== "system")
      .map((m) => {
        // Tool result message
        if (m.role === "tool" && m.toolCallId) {
          return {
            role: "user" as const,
            content: [
              {
                type: "tool_result" as const,
                tool_use_id: m.toolCallId,
                content:
                  typeof m.content === "string"
                    ? m.content
                    : "",
              },
            ],
          };
        }

        // Assistant message with tool calls
        if (
          m.role === "assistant" &&
          m.toolCalls?.length
        ) {
          const content: Anthropic.ContentBlock[] = [];
          if (typeof m.content === "string" && m.content) {
            content.push({
              type: "text",
              text: m.content,
            } as Anthropic.TextBlock);
          }
          for (const tc of m.toolCalls) {
            content.push({
              type: "tool_use",
              id: tc.id,
              name: tc.name,
              input: tc.input,
            } as Anthropic.ToolUseBlock);
          }
          return {
            role: "assistant" as const,
            content,
          };
        }

        // Regular message
        return {
          role: m.role as "user" | "assistant",
          content:
            typeof m.content === "string"
              ? m.content
              : JSON.stringify(m.content),
        };
      });
  }

  private parseResponse(
    response: Anthropic.Message,
  ): LLMResponse {
    let textContent = "";
    const toolCalls: ToolCall[] = [];

    for (const block of response.content) {
      if (block.type === "text") {
        textContent += block.text;
      } else if (block.type === "tool_use") {
        toolCalls.push({
          id: block.id,
          name: block.name,
          input: block.input,
        });
      }
    }

    return {
      content: textContent,
      toolCalls:
        toolCalls.length > 0
          ? toolCalls
          : undefined,
      stopReason:
        response.stop_reason === "tool_use"
          ? "tool_use"
          : response.stop_reason === "max_tokens"
            ? "max_tokens"
            : "end_turn",
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  }
}
