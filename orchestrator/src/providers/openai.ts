/**
 * OpenAI LLM Provider.
 *
 * Shows how to implement the same LLMProvider
 * interface for a different LLM backend.
 */

import OpenAI from "openai";
import type {
  LLMProvider,
  LLMRequest,
  LLMResponse,
  ToolCall,
} from "../types/index.js";

export class OpenAIProvider implements LLMProvider {
  private client: OpenAI;

  constructor(apiKey?: string) {
    this.client = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY,
    });
  }

  async createMessage(
    request: LLMRequest,
  ): Promise<LLMResponse> {
    const messages: OpenAI.ChatCompletionMessageParam[] =
      [
        // System prompt → system message
        {
          role: "system",
          content: request.systemPrompt,
        },
        // Convert conversation messages
        ...this.convertMessages(request.messages),
      ];

    const response =
      await this.client.chat.completions.create({
        model: request.model,
        messages,
        tools: request.tools.map((t) => ({
          type: "function" as const,
          function: {
            name: t.name,
            description: t.description,
            parameters: t.inputSchema,
          },
        })),
        max_tokens: request.maxTokens ?? 4096,
        ...(request.temperature !== undefined && {
          temperature: request.temperature,
        }),
      });

    return this.parseResponse(response);
  }

  private convertMessages(
    messages: LLMRequest["messages"],
  ): OpenAI.ChatCompletionMessageParam[] {
    return messages
      .filter((m) => m.role !== "system")
      .map((m) => {
        // Tool result
        if (m.role === "tool" && m.toolCallId) {
          return {
            role: "tool" as const,
            tool_call_id: m.toolCallId,
            content:
              typeof m.content === "string"
                ? m.content
                : JSON.stringify(m.content),
          };
        }

        // Assistant with tool calls
        if (
          m.role === "assistant" &&
          m.toolCalls?.length
        ) {
          return {
            role: "assistant" as const,
            content:
              typeof m.content === "string"
                ? m.content || null
                : null,
            tool_calls: m.toolCalls.map((tc) => ({
              id: tc.id,
              type: "function" as const,
              function: {
                name: tc.name,
                arguments: JSON.stringify(tc.input),
              },
            })),
          };
        }

        // Regular user/assistant message
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
    response: OpenAI.ChatCompletion,
  ): LLMResponse {
    const choice = response.choices[0];
    if (!choice) {
      return {
        content: "",
        stopReason: "end_turn",
      };
    }

    const msg = choice.message;
    const toolCalls: ToolCall[] = (
      msg.tool_calls ?? []
    ).map((tc) => ({
      id: tc.id,
      name: tc.function.name,
      input: JSON.parse(tc.function.arguments),
    }));

    return {
      content: msg.content ?? "",
      toolCalls:
        toolCalls.length > 0
          ? toolCalls
          : undefined,
      stopReason:
        choice.finish_reason === "tool_calls"
          ? "tool_use"
          : choice.finish_reason === "length"
            ? "max_tokens"
            : "end_turn",
      usage: response.usage
        ? {
            inputTokens:
              response.usage.prompt_tokens,
            outputTokens:
              response.usage.completion_tokens ?? 0,
          }
        : undefined,
    };
  }
}
