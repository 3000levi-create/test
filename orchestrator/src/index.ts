/**
 * Multi-Agent Orchestrator
 *
 * Usage example showing how to wire everything
 * together — agents, tools, provider, and
 * the orchestrator.
 *
 * Based on patterns from claude-code-main.
 */

export { Orchestrator } from "./Orchestrator.js";
export { AgentRunner } from "./agents/AgentRunner.js";
export { buildTool } from "./tools/buildTool.js";
export { AnthropicProvider } from "./providers/anthropic.js";
export { OpenAIProvider } from "./providers/openai.js";
export * from "./types/index.js";
export {
  BashTool,
  FileReadTool,
  FileWriteTool,
  GrepTool,
} from "./tools/exampleTools.js";
