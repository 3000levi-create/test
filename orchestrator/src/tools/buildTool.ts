/**
 * Tool builder — same pattern as
 * claude-code-main/src/Tool.ts buildTool()
 *
 * Creates self-contained tool definitions
 * with Zod validation, permissions, and
 * concurrency safety declarations.
 */

import type { z } from "zod";
import type {
  ToolDefinition,
  ToolResult,
  ToolUseContext,
} from "../types/index.js";

interface BuildToolOptions<TInput, TOutput> {
  name: string;
  description: string;
  inputSchema: z.ZodType<TInput>;
  isConcurrencySafe?: boolean;
  isReadOnly?: boolean;
  call: (
    input: TInput,
    context: ToolUseContext,
  ) => Promise<ToolResult<TOutput>>;
}

export function buildTool<TInput, TOutput>(
  options: BuildToolOptions<TInput, TOutput>,
): ToolDefinition<TInput, TOutput> {
  return {
    name: options.name,
    description: options.description,
    inputSchema: options.inputSchema,
    isConcurrencySafe:
      options.isConcurrencySafe ?? false,
    isReadOnly: options.isReadOnly ?? false,
    call: options.call,
  };
}
