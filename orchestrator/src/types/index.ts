/**
 * Core types for the multi-agent orchestrator.
 *
 * Based on patterns from claude-code-main/src/Tool.ts,
 * claude-code-main/src/coordinator/coordinatorMode.ts,
 * and claude-code-main/src/tasks/ system.
 */

import { z } from "zod";

// ─── Tool Types ─────────────────────────────

export type ToolInputJSONSchema = {
  type: "object";
  properties?: Record<string, unknown>;
  required?: string[];
};

export interface ToolDefinition<
  TInput = unknown,
  TOutput = unknown,
> {
  name: string;
  description: string;
  inputSchema: z.ZodType<TInput>;
  /**
   * Whether this tool can run in parallel
   * with other tools (safe = no side effects).
   */
  isConcurrencySafe: boolean;
  isReadOnly: boolean;
  call(
    input: TInput,
    context: ToolUseContext,
  ): Promise<ToolResult<TOutput>>;
}

export interface ToolResult<T = unknown> {
  data: T;
  error?: string;
}

export interface ToolUseContext {
  agentId: string;
  cwd: string;
  abortSignal?: AbortSignal;
}

// ─── Agent Types ────────────────────────────

export type AgentStatus =
  | "idle"
  | "running"
  | "completed"
  | "failed"
  | "stopped";

export interface AgentDefinition {
  /** Unique type identifier, e.g. "researcher" */
  agentType: string;
  /** Human-readable: when should the
   *  orchestrator pick this agent? */
  whenToUse: string;
  /** System prompt for this agent */
  systemPrompt: string;
  /** Tool names this agent can access.
   *  ["*"] = all tools */
  tools: string[];
  /** Tools explicitly denied */
  disallowedTools?: string[];
  /** Model override (optional) */
  model?: string;
}

export interface AgentInstance {
  id: string;
  definition: AgentDefinition;
  status: AgentStatus;
  messages: Message[];
  createdAt: number;
  result?: string;
  error?: string;
}

// ─── Message Types ──────────────────────────

export type Role = "user" | "assistant" | "system" | "tool";

export interface Message {
  role: Role;
  content: string | ContentBlock[];
  name?: string;
  toolCallId?: string;
  toolCalls?: ToolCall[];
}

export interface ContentBlock {
  type: "text" | "image" | "tool_use" | "tool_result";
  text?: string;
  toolUseId?: string;
  toolName?: string;
  input?: unknown;
  content?: string;
  isError?: boolean;
}

export interface ToolCall {
  id: string;
  name: string;
  input: unknown;
}

// ─── Task Types ─────────────────────────────

export type TaskStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "stopped";

export interface Task {
  id: string;
  agentId: string;
  description: string;
  status: TaskStatus;
  prompt: string;
  result?: string;
  error?: string;
  createdAt: number;
  completedAt?: number;
}

// ─── Orchestrator Types ─────────────────────

export interface OrchestratorConfig {
  /** Available agent definitions */
  agents: AgentDefinition[];
  /** Available tools */
  tools: ToolDefinition[];
  /** Default model for agents */
  defaultModel: string;
  /** Max concurrent agents */
  maxConcurrency: number;
  /** Max turns per agent before stopping */
  maxTurnsPerAgent: number;
}

export interface TaskNotification {
  taskId: string;
  agentId: string;
  status: TaskStatus;
  summary: string;
  result?: string;
  tokenUsage?: {
    total: number;
    toolUses: number;
    durationMs: number;
  };
}

// ─── LLM Provider Types ─────────────────────

export interface LLMRequest {
  model: string;
  systemPrompt: string;
  messages: Message[];
  tools: LLMToolSchema[];
  maxTokens?: number;
  temperature?: number;
}

export interface LLMToolSchema {
  name: string;
  description: string;
  inputSchema: ToolInputJSONSchema;
}

export interface LLMResponse {
  content: string;
  toolCalls?: ToolCall[];
  stopReason: "end_turn" | "tool_use" | "max_tokens";
  usage?: { inputTokens: number; outputTokens: number };
}

/**
 * Abstract LLM provider — implement this
 * to connect any LLM (Anthropic, OpenAI,
 * Ollama, etc.)
 */
export interface LLMProvider {
  createMessage(
    request: LLMRequest,
  ): Promise<LLMResponse>;
}
