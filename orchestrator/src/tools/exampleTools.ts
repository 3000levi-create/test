/**
 * Example tools — showing how to create
 * tools following the claude-code pattern.
 *
 * Based on:
 * claude-code-main/src/tools/BashTool/
 * claude-code-main/src/tools/FileReadTool/
 * claude-code-main/src/tools/GrepTool/
 */

import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import { z } from "zod";
import { buildTool } from "./buildTool.js";

// ─── Bash Tool ──────────────────────────────

export const BashTool = buildTool({
  name: "bash",
  description:
    "Execute a shell command and return output.",
  inputSchema: z.object({
    command: z
      .string()
      .describe("The shell command to run"),
    timeout: z
      .number()
      .optional()
      .describe("Timeout in milliseconds"),
  }),
  isConcurrencySafe: false,
  isReadOnly: false,
  async call(input, context) {
    try {
      const output = execSync(input.command, {
        cwd: context.cwd,
        timeout: input.timeout ?? 30000,
        encoding: "utf-8",
        maxBuffer: 1024 * 1024,
      });
      return { data: output };
    } catch (err: any) {
      return {
        data: err.stdout ?? "",
        error: err.stderr ?? err.message,
      };
    }
  },
});

// ─── File Read Tool ─────────────────────────

export const FileReadTool = buildTool({
  name: "file_read",
  description: "Read the contents of a file.",
  inputSchema: z.object({
    path: z
      .string()
      .describe("Absolute path to the file"),
    offset: z
      .number()
      .optional()
      .describe("Line number to start from"),
    limit: z
      .number()
      .optional()
      .describe("Max lines to read"),
  }),
  isConcurrencySafe: true,
  isReadOnly: true,
  async call(input) {
    try {
      const content = readFileSync(
        input.path,
        "utf-8",
      );
      const lines = content.split("\n");
      const start = input.offset ?? 0;
      const end = input.limit
        ? start + input.limit
        : lines.length;
      const sliced = lines.slice(start, end);

      return {
        data: sliced
          .map(
            (line, i) =>
              `${start + i + 1}\t${line}`,
          )
          .join("\n"),
      };
    } catch (err: any) {
      return {
        data: "",
        error: err.message,
      };
    }
  },
});

// ─── File Write Tool ────────────────────────

export const FileWriteTool = buildTool({
  name: "file_write",
  description:
    "Write content to a file (overwrites).",
  inputSchema: z.object({
    path: z
      .string()
      .describe("Absolute path to write to"),
    content: z
      .string()
      .describe("Content to write"),
  }),
  isConcurrencySafe: false,
  isReadOnly: false,
  async call(input) {
    try {
      writeFileSync(input.path, input.content);
      return { data: `Wrote ${input.path}` };
    } catch (err: any) {
      return { data: "", error: err.message };
    }
  },
});

// ─── Grep Tool ──────────────────────────────

export const GrepTool = buildTool({
  name: "grep",
  description:
    "Search file contents using regex.",
  inputSchema: z.object({
    pattern: z
      .string()
      .describe("Regex pattern to search"),
    path: z
      .string()
      .optional()
      .describe("Directory to search in"),
    glob: z
      .string()
      .optional()
      .describe('File glob, e.g. "*.ts"'),
  }),
  isConcurrencySafe: true,
  isReadOnly: true,
  async call(input, context) {
    try {
      const args = [
        "rg",
        "--no-heading",
        "-n",
        input.pattern,
      ];
      if (input.glob) {
        args.push("--glob", input.glob);
      }
      args.push(input.path ?? context.cwd);

      const output = execSync(args.join(" "), {
        cwd: context.cwd,
        encoding: "utf-8",
        maxBuffer: 1024 * 1024,
      });
      return { data: output };
    } catch (err: any) {
      if (err.status === 1) {
        return { data: "No matches found" };
      }
      return { data: "", error: err.message };
    }
  },
});
