# Bug Bounty Multi-Agent Orchestrator

A self-improving, multi-agent security research pipeline built on [Claude Code](https://claude.ai/code), inspired by the architecture of [claude-code](https://github.com/anthropics/claude-code) and the self-learning patterns of [Hermes Agent](https://github.com/NousResearch/hermes-agent).

> **IMPORTANT**: This tool is for **authorized security testing only** — bug bounty programs (HackerOne, Bugcrowd) with explicit scope and permission. Never test targets without authorization.

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Agents](#agents)
- [Skills (Slash Commands)](#skills-slash-commands)
- [Self-Learning System](#self-learning-system)
- [Memory System](#memory-system)
- [Orchestrator SDK](#orchestrator-sdk)
- [Workflows](#workflows)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Credits & Inspiration](#credits--inspiration)
- [License & Disclaimer](#license--disclaimer)

---

## Features

### Multi-Agent Pipeline
- **6 specialized agents**, each with their own tools, model, and system prompt
- **Parallel execution** — launch up to 10 agents simultaneously for maximum speed
- **Agent continuation** — send follow-up messages to agents without losing context
- **Worktree isolation** — agents can work in isolated git worktrees to avoid conflicts

### Self-Learning (Hermes-style)
- **Automatic skill creation** — after each successful hunt, the pipeline captures the technique as a reusable skill
- **Skill refinement** — skills improve with each use: better search patterns, fewer false positives, tracked success rates
- **Persistent memory** — three-layer memory system that persists across sessions
- **Cross-referencing** — findings on one target automatically flag similar patterns on other targets

### Performance
- **Multi-threading** — `/checklist` launches 10 parallel agents (one per OWASP category)
- **Read-only agents run in parallel** — recon, auditing, and analysis agents are concurrency-safe
- **Write agents run sequentially** — exploit writing and report generation avoid conflicts
- **Model routing** — Opus for deep analysis, Sonnet for fast recon (configurable per agent)

---

## Architecture

```
                    ┌─────────────────────────┐
                    │      Orchestrator        │
                    │   (Coordinator Mode)     │
                    │                          │
                    │  Decomposes tasks        │
                    │  Routes to agents        │
                    │  Synthesizes results     │
                    └─────┬───────────────────┘
                          │
          ┌───────────────┼───────────────────────┐
          │               │               │       │
          ▼               ▼               ▼       ▼
   ┌────────────┐  ┌────────────┐  ┌──────────┐  ┌──────────┐
   │   Recon    │  │   Code     │  │  Vuln    │  │  Report  │
   │   Agent    │  │  Auditor   │  │ Analyzer │  │  Writer  │
   │  (sonnet)  │  │  (opus)    │  │  (opus)  │  │ (sonnet) │
   └─────┬──────┘  └─────┬──────┘  └────┬─────┘  └────┬─────┘
         │               │              │              │
         ▼               ▼              ▼              ▼
   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
   │  WebFetch │   │  Grep    │   │  Read    │   │  Write   │
   │  Bash     │   │  Read    │   │  Grep    │   │  Edit    │
   │  WebSearch│   │  Bash    │   │  Bash    │   │  WebSearch│
   └──────────┘   └──────────┘   └──────────┘   └──────────┘
         │               │              │              │
         └───────────────┴──────┬───────┴──────────────┘
                                │
                         ┌──────────────┐
                         │   Learner    │
                         │   Agent      │
                         │              │
                         │ Extracts     │
                         │ patterns,    │
                         │ creates      │
                         │ skills,      │
                         │ updates      │
                         │ memory       │
                         └──────┬───────┘
                                │
                    ┌───────────┼───────────┐
                    ▼           ▼           ▼
              ┌──────────┐ ┌────────┐ ┌─────────┐
              │MEMORY.md │ │TARGETS │ │ learned/│
              │          │ │  .md   │ │hunt-*.md│
              └──────────┘ └────────┘ └─────────┘
```

### Data Flow

```
User Request
    │
    ▼
/recon target.com ──→ 4 parallel agents ──→ Attack Surface Map
    │
    ▼
/analyze ./src ──→ 4 parallel agents ──→ Vulnerability Findings
    │
    ▼
/after-hunt ──→ Learner Agent ──→ Skills + Memory Updated
    │
    ▼
/report ──→ Report Writer + Exploit Writer ──→ HackerOne Report + PoC
```

---

## Quick Start

### Prerequisites

- [Claude Code CLI](https://claude.ai/code) installed
- An Anthropic API key (or Claude Pro/Max subscription)

### Installation

```bash
# Clone the repo
git clone https://github.com/3000levi-create/test.git
cd test/orchestrator

# Option A: Use Claude Code directly (recommended)
# The .claude/ folder contains all agents and skills.
# Just open Claude Code in this directory:
claude

# Option B: Use the TypeScript SDK
npm install
npx tsx src/example.ts
```

### First Run

```bash
# Start Claude Code in the orchestrator directory
cd orchestrator
claude

# Inside Claude Code:

# 1. Set up a target
/memory target example.com

# 2. Run recon
/recon example.com

# 3. Analyze source code (if available)
/analyze ./path/to/source

# 4. Run OWASP Top 10 checklist
/checklist ./path/to/source

# 5. After finding a vulnerability:
/after-hunt

# 6. Generate a report
/report SSRF in image upload endpoint
```

---

## Agents

### recon-agent
| | |
|---|---|
| **Purpose** | Attack surface mapping: subdomains, endpoints, tech stack, OSINT |
| **Model** | Sonnet (fast) |
| **Mode** | Read-only (no file modifications) |
| **Tools** | Bash, Read, Glob, Grep, WebFetch, WebSearch, TodoWrite |
| **Concurrency** | Safe to run in parallel |

```
Use the recon-agent to enumerate all subdomains and API endpoints for target.com
```

### code-auditor
| | |
|---|---|
| **Purpose** | Source code vulnerability analysis (OWASP Top 10) |
| **Model** | Opus (deep analysis) |
| **Mode** | Read-only |
| **Tools** | Read, Glob, Grep, Bash, WebSearch, TodoWrite |
| **Concurrency** | Safe to run in parallel |

```
Use the code-auditor to scan ./src/api for SQL injection and command injection
```

### vuln-analyzer
| | |
|---|---|
| **Purpose** | Deep-dive: confirms exploitability, traces data flow, scores CVSS |
| **Model** | Opus |
| **Mode** | Read-only |
| **Tools** | Read, Glob, Grep, Bash, WebFetch, WebSearch, TodoWrite |
| **Concurrency** | Safe to run in parallel |

```
Use the vuln-analyzer to confirm the SSRF in src/services/fetch.ts:42
```

### exploit-writer
| | |
|---|---|
| **Purpose** | Creates minimal, safe Proof of Concept scripts |
| **Model** | Opus |
| **Mode** | Read + Write |
| **Tools** | Bash, Read, Write, Edit, Glob, Grep, WebFetch |
| **Concurrency** | Sequential (writes files) |

```
Use the exploit-writer to create a safe PoC for the blind SQLi in /api/search
```

### report-writer
| | |
|---|---|
| **Purpose** | Professional HackerOne/Bugcrowd report generation |
| **Model** | Sonnet (fast) |
| **Mode** | Read + Write |
| **Tools** | Read, Write, Edit, Glob, Grep, WebSearch |
| **Concurrency** | Sequential (writes files) |

```
Use the report-writer to format the IDOR finding as a HackerOne report
```

### learner
| | |
|---|---|
| **Purpose** | Meta-learning: extracts patterns from hunts, creates/refines skills, updates memory |
| **Model** | Opus |
| **Mode** | Read + Write |
| **Tools** | Read, Write, Edit, Glob, Grep, Bash, TodoWrite |
| **Concurrency** | Sequential (writes files) |

```
Use the learner to analyze my last hunt and create a reusable skill
```

---

## Skills (Slash Commands)

### Hunting Skills

#### `/recon [target]`
Full reconnaissance pipeline. Launches **4 parallel agents**:
1. DNS & subdomain enumeration
2. Technology fingerprinting
3. Endpoint discovery
4. OSINT research

Output: `reports/[target]/recon_[date].md`

#### `/analyze [target or path]`
Vulnerability analysis pipeline. Launches **4 parallel agents**:
1. Injection analysis (SQLi, CMDi, SSTI, etc.)
2. Authentication & access control audit
3. Data exposure & SSRF scan
4. Client-side & business logic flaws

Output: `reports/[target]/analysis_[date].md`

#### `/checklist [target or path]`
OWASP Top 10 (2021) systematic audit. Launches **10 parallel agents** — one per category:
- A01: Broken Access Control
- A02: Cryptographic Failures
- A03: Injection
- A04: Insecure Design
- A05: Security Misconfiguration
- A06: Vulnerable Components
- A07: Auth Failures
- A08: Data Integrity Failures
- A09: Logging & Monitoring
- A10: SSRF

Output: `reports/[target]/owasp_checklist_[date].md`

#### `/report [description]`
Generates a professional bug bounty report with:
- One-paragraph summary
- CVSS score + justification
- Step-by-step reproduction
- HTTP request/response examples
- Proof of Concept script
- Remediation suggestion

Output: `reports/[target]/[date]_[vuln-type]_report.md`

### Self-Learning Skills

#### `/learn`
After a successful hunt, captures the technique as a reusable skill. Analyzes what patterns led to the finding, what grep searches worked, and what false positives to filter.

Output: `.claude/skills/learned/hunt-[type].md`

#### `/after-hunt`
Post-hunt feedback loop. Automatically:
- Updates `MEMORY.md` with the new technique
- Updates `TARGETS.md` with the finding
- Creates or refines a learned skill
- Cross-references other targets for similar patterns

#### `/memory`
Review and manage the persistent knowledge base.

```bash
/memory              # Review all memory layers
/memory target X     # Create/update target profile
/memory search Y     # Search across all memory + reports
```

---

## Self-Learning System

Inspired by [Hermes Agent](https://github.com/NousResearch/hermes-agent)'s 4-stage learning loop:

```
┌─────────┐     ┌──────────┐     ┌──────────┐     ┌─────────┐
│ Execute │ ──→ │ Evaluate │ ──→ │ Abstract │ ──→ │ Refine  │
│         │     │          │     │          │     │         │
│ Hunt    │     │ What     │     │ Extract  │     │ Update  │
│ for     │     │ worked?  │     │ reusable │     │ skill   │
│ bugs    │     │ What     │     │ pattern  │     │ with    │
│         │     │ didn't?  │     │ as skill │     │ new     │
│         │     │          │     │          │     │ data    │
└─────────┘     └──────────┘     └──────────┘     └─────────┘
     ▲                                                  │
     └──────────────────────────────────────────────────┘
                    Next hunt is smarter
```

### How Skills Improve Over Time

| Hunt # | What Happens |
|--------|--------------|
| 1 | Pipeline works, first skill created (`hunt-sqli.md`) |
| 3 | Skill refined with new patterns, false positives filtered |
| 5 | 3-4 skills exist, discovery speed noticeably faster |
| 10 | Pipeline knows your targets, suggests where to look |
| 20+ | Learned skills rival custom tooling — tuned to your style |

### Auto-Learned Skill Example

After finding a few SQL injection bugs, the pipeline creates:

```
.claude/skills/learned/hunt-sqli.md
```

```markdown
# Hunt: SQL Injection

## Success Rate
- Times used: 7
- Vulns found: 4
- Last refined: 2026-04-13

## Patterns That Work
- grep: `query.*\$\{|execute.*\+|raw.*sql`
- grep: `knex\.raw\(|sequelize\.query\(`
- Indicators: string concatenation in SQL, missing parameterized queries

## False Positive Filters
- Skip: ORM-generated queries with bound params
- Skip: Read-only analytics queries
- Skip: Migration files

## Changelog
- 2026-03-15: Created from target-a session
- 2026-03-22: Added Sequelize patterns from target-b
- 2026-04-01: Refined false positive filter (ORM)
- 2026-04-13: Added knex.raw pattern from target-c
```

---

## Memory System

Three persistent layers, inspired by Hermes Agent's `MEMORY.md` + `USER.md` architecture:

| File | Purpose | Hermes Equivalent |
|------|---------|-------------------|
| `MEMORY.md` | Techniques, patterns, tool shortcuts, stats | `MEMORY.md` |
| `TARGETS.md` | Target profiles, findings, bounty tracking | Session recall (SQLite) |
| `CLAUDE.md` | Pipeline config, agent setup, workflow prefs | `USER.md` |

### MEMORY.md
Stores what the pipeline has learned:
- Technique library (grep patterns, indicators)
- High-value patterns (what pays well)
- False positive filters
- Pipeline statistics

### TARGETS.md
Stores per-target knowledge:
- Program info (platform, scope, bounty range)
- Attack surface (subdomains, tech stack, endpoints)
- Findings log (date, type, severity, status, bounty)
- Tested areas checklist
- Notes for next session

### CLAUDE.md
Stores pipeline configuration:
- Available agents and their roles
- Available skills and usage
- Self-improvement loop description

---

## Orchestrator SDK

Beyond the Claude Code pipeline, this project includes a TypeScript SDK for building custom multi-agent systems:

```typescript
import {
  Orchestrator,
  AnthropicProvider,
  // OpenAIProvider,  // Also supported
  BashTool,
  FileReadTool,
  GrepTool,
} from "./src/index.js";

const orchestrator = new Orchestrator(
  {
    agents: [/* your agent definitions */],
    tools: [BashTool, FileReadTool, GrepTool],
    defaultModel: "claude-sonnet-4-20250514",
    maxConcurrency: 3,
    maxTurnsPerAgent: 15,
  },
  new AnthropicProvider(),
);

const response = await orchestrator.processMessage(
  "Find all TODO comments in the codebase"
);
```

### Key SDK Components

| File | Purpose |
|------|---------|
| `src/Orchestrator.ts` | Coordinator that routes tasks to agents |
| `src/agents/AgentRunner.ts` | Runs a single agent's tool-call loop |
| `src/providers/anthropic.ts` | Anthropic Claude API provider |
| `src/providers/openai.ts` | OpenAI API provider |
| `src/tools/buildTool.ts` | Tool factory with Zod validation |
| `src/tools/exampleTools.ts` | Built-in tools (bash, read, write, grep) |
| `src/types/index.ts` | All TypeScript type definitions |

### Swap LLM Providers

```typescript
// Anthropic (default)
const provider = new AnthropicProvider();

// OpenAI
const provider = new OpenAIProvider();

// Both implement the same LLMProvider interface
```

---

## Workflows

### Workflow 1: Full Pipeline (Recon → Report)

```bash
claude                          # Start Claude Code
/memory target example.com      # Set up target profile
/recon example.com              # 4 parallel recon agents
/analyze ./source               # 4 parallel audit agents
/after-hunt                     # Learn from findings
/report SSRF in /api/fetch      # Generate HackerOne report
```

### Workflow 2: Focused Code Audit

```bash
claude
/checklist ./backend/src        # 10 parallel OWASP agents
# Review findings, then:
Use the vuln-analyzer to confirm the SQLi in src/db/queries.ts:87
/report SQLi in user search
/after-hunt
```

### Workflow 3: Batch Audit

```bash
claude
/batch audit every route handler in ./src/routes for missing authentication checks
# Spawns 5-30 parallel agents in isolated worktrees
```

### Workflow 4: Continue from Previous Session

```bash
claude
/memory                          # Review what you know
/memory search "example.com"     # Recall past findings
# Pipeline remembers targets, techniques, and findings
```

---

## Project Structure

```
orchestrator/
├── CLAUDE.md                          # Pipeline config & instructions
├── MEMORY.md                          # Learned techniques & patterns
├── TARGETS.md                         # Target profiles & findings
├── package.json
├── tsconfig.json
│
├── .claude/
│   ├── agents/                        # Custom agent definitions
│   │   ├── recon-agent.md             # Reconnaissance specialist
│   │   ├── code-auditor.md            # Source code security auditor
│   │   ├── vuln-analyzer.md           # Deep vulnerability analyzer
│   │   ├── exploit-writer.md          # Safe PoC developer
│   │   ├── report-writer.md           # HackerOne report formatter
│   │   └── learner.md                 # Self-improving meta-agent
│   │
│   └── skills/                        # Slash command skills
│       ├── recon.md                   # /recon — parallel reconnaissance
│       ├── analyze.md                 # /analyze — parallel vuln audit
│       ├── checklist.md               # /checklist — OWASP Top 10
│       ├── report.md                  # /report — professional reports
│       ├── learn.md                   # /learn — capture techniques
│       ├── after-hunt.md              # /after-hunt — feedback loop
│       ├── memory.md                  # /memory — knowledge manager
│       └── learned/                   # Auto-generated skills
│           └── hunt-*.md              # (created by learning loop)
│
├── src/                               # TypeScript SDK
│   ├── index.ts                       # Package exports
│   ├── example.ts                     # Usage example
│   ├── Orchestrator.ts                # Main coordinator
│   ├── agents/
│   │   └── AgentRunner.ts             # Agent tool-call loop
│   ├── providers/
│   │   ├── anthropic.ts               # Claude API provider
│   │   └── openai.ts                  # OpenAI API provider
│   ├── tools/
│   │   ├── buildTool.ts               # Tool factory
│   │   └── exampleTools.ts            # Built-in tools
│   ├── types/
│   │   └── index.ts                   # Type definitions
│   └── utils/
│       └── zodToJsonSchema.ts         # Schema converter
│
└── reports/                           # Generated reports (gitignored)
    └── [target]/
        ├── recon_[date].md
        ├── analysis_[date].md
        ├── owasp_checklist_[date].md
        ├── [date]_[vuln]_report.md
        └── poc/
            └── poc_[vuln].py
```

---

## Configuration

### Agent Models

Each agent has a default model. Override in the agent's `.md` frontmatter:

```yaml
# .claude/agents/code-auditor.md
---
model: opus          # opus for deep analysis
# model: sonnet      # sonnet for speed
# model: haiku       # haiku for bulk/cheap
---
```

### Agent Tools

Control what each agent can access:

```yaml
---
tools:
  - Read
  - Grep
  - Bash
disallowedTools:
  - Write          # Read-only agent
  - Edit
---
```

### Environment Variables

| Variable | Purpose |
|----------|---------|
| `ANTHROPIC_API_KEY` | Claude API key |
| `OPENAI_API_KEY` | OpenAI API key (if using OpenAI provider) |

---

## Credits & Inspiration

### Architecture Source
The multi-agent orchestrator pattern is based on the [Claude Code](https://github.com/anthropics/claude-code) source code, specifically:
- `src/coordinator/coordinatorMode.ts` — Coordinator system prompt and agent management
- `src/tools/AgentTool/` — Agent spawning, tool resolution, and lifecycle
- `src/query.ts` — The core tool-call loop
- `src/skills/bundled/batch.ts` — Parallel batch execution pattern
- `src/skills/bundled/skillify.ts` — Skill creation from sessions

### Self-Learning Inspiration
The self-improving learning loop is inspired by [Hermes Agent](https://github.com/NousResearch/hermes-agent) by Nous Research:
- **Skill learning** — creating reusable skills from experience
- **Persistent memory** — `MEMORY.md` architecture
- **Self-refinement** — skills improve with each use
- **Session recall** — searching past conversations for relevant knowledge

---

## License & Disclaimer

This tool is provided for **authorized security research only**.

- Always operate within the scope defined by the bug bounty program
- Never test targets without explicit authorization
- Use safe, minimal-impact payloads in PoCs
- Follow responsible disclosure practices
- Respect rate limits and terms of service

The authors are not responsible for misuse. By using this tool, you agree to only use it for authorized testing within legal boundaries.
