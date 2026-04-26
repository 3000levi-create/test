/**
 * Example: How to use the orchestrator.
 *
 * Run: npx tsx orchestrator/src/example.ts
 */

import { Orchestrator } from "./Orchestrator.js";
import { AnthropicProvider } from "./providers/anthropic.js";
// import { OpenAIProvider } from "./providers/openai.js";
import {
  BashTool,
  FileReadTool,
  FileWriteTool,
  GrepTool,
} from "./tools/exampleTools.js";
import type { AgentDefinition } from "./types/index.js";

// ─── 1. Define Your Agents ─────────────────

const agents: AgentDefinition[] = [
  {
    agentType: "researcher",
    whenToUse:
      "Research questions, explore code, " +
      "find files and patterns. Read-only.",
    systemPrompt:
      "You are a code researcher. " +
      "Search the codebase thoroughly. " +
      "Report file paths, line numbers, " +
      "and key findings. " +
      "Do NOT modify any files.",
    tools: ["file_read", "grep", "bash"],
    disallowedTools: ["file_write"],
  },
  {
    agentType: "coder",
    whenToUse:
      "Implement code changes, fix bugs, " +
      "add features. Can read and write files.",
    systemPrompt:
      "You are a code implementer. " +
      "Make precise, targeted changes. " +
      "Always verify your work compiles. " +
      "Commit when done and report the hash.",
    tools: ["*"],
  },
  {
    agentType: "reviewer",
    whenToUse:
      "Review code changes, run tests, " +
      "verify correctness. Read-only.",
    systemPrompt:
      "You are a code reviewer. " +
      "Check changes for correctness, " +
      "edge cases, and test coverage. " +
      "Run tests. Be skeptical. " +
      "Do NOT modify files.",
    tools: ["file_read", "grep", "bash"],
    disallowedTools: ["file_write"],
  },
  {
    agentType: "devops",
    whenToUse:
      "Docker, CI/CD, deployment tasks, " +
      "infrastructure changes.",
    systemPrompt:
      "You are a DevOps specialist. " +
      "Handle Docker, CI/CD, and deployment. " +
      "Be careful with destructive commands.",
    tools: ["bash", "file_read", "file_write"],
  },
];

// ─── 2. Choose Your LLM Provider ───────────

// Option A: Anthropic
const provider = new AnthropicProvider();

// Option B: OpenAI (uncomment to use)
// const provider = new OpenAIProvider();

// ─── 3. Create The Orchestrator ─────────────

const orchestrator = new Orchestrator(
  {
    agents,
    tools: [
      BashTool,
      FileReadTool,
      FileWriteTool,
      GrepTool,
    ],
    defaultModel: "claude-sonnet-4-20250514",
    // For OpenAI: "gpt-4o"
    maxConcurrency: 3,
    maxTurnsPerAgent: 15,
  },
  provider,
);

// ─── 4. Use It ──────────────────────────────

async function main() {
  console.log("Starting orchestrator...\n");

  // The orchestrator will:
  // 1. Analyze the request
  // 2. Decide which agents to spawn
  // 3. Run them (parallel if possible)
  // 4. Synthesize results
  // 5. Return a response
  const response =
    await orchestrator.processMessage(
      "Find all TODO comments in the codebase " +
        "and create a summary of what needs " +
        "to be done.",
    );

  console.log("\n--- Orchestrator Response ---");
  console.log(response);

  // Check what happened
  console.log("\n--- Agents Used ---");
  for (const agent of orchestrator.getAllAgents()) {
    console.log(
      `  ${agent.definition.agentType}: ` +
        `${agent.status}`,
    );
  }

  console.log("\n--- Tasks ---");
  for (const task of orchestrator.getAllTasks()) {
    console.log(
      `  ${task.description}: ${task.status}`,
    );
  }
}

main().catch(console.error);
