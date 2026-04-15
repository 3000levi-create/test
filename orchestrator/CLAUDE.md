# Bug Bounty Security Research Pipeline

## Overview

This project uses Claude Code's multi-agent architecture
for authorized security research on bug bounty programs
(HackerOne, Bugcrowd, etc).

**IMPORTANT**: This is for AUTHORIZED security testing
only. Always operate within the scope defined by the
bug bounty program.

## How to Use

### Quick Start — Full Pipeline

```bash
# Run the full recon → analysis → report pipeline
claude "run /recon on https://target.com"

# Or use specific phases:
claude "/recon target.com"
claude "/analyze target.com"  
claude "/report"
```

### Custom Agents

```bash
# Spawn specific agents:
claude "use the recon-agent to map target.com"
claude "use the code-auditor to review this source"
claude "use the vuln-analyzer for the auth module"
```

### Parallel Research (Batch)

```bash
# Launch parallel research on multiple areas:
claude "/batch audit all API endpoints for IDOR"
```

## Agent Types

| Agent | Purpose |
|-------|---------|
| recon-agent | Subdomain, endpoint, tech discovery |
| code-auditor | Source code vulnerability analysis |
| vuln-analyzer | Deep-dive on specific vuln classes |
| **bounty-verifier** | **Adversarial exploit proof. VERDICT: EXPLOITABLE/NOT/PARTIAL** |
| exploit-writer | PoC development (authorized only) |
| report-writer | HackerOne report formatting |
| **learner** | **Self-improving: learns from hunts, creates/refines skills** |

## Skills

### Hunting Skills
| Skill | Usage |
|-------|-------|
| /recon | Full reconnaissance pipeline |
| /analyze | Vulnerability analysis |
| /report | Generate HackerOne report |
| /checklist | OWASP Top 10 checklist scan |
| /security-review | Senior-engineer-grade review with 17 false-positive filters + confidence scoring (>= 8) |
| /verify | **Adversarial exploit verification — prove before you report** |

### Self-Learning Skills (Hermes-style)
| Skill | Usage |
|-------|-------|
| /learn | Capture a technique as a reusable skill |
| /after-hunt | Post-hunt feedback loop (auto-updates memory + skills) |
| /memory | Review and manage persistent knowledge |
| /memory target [name] | Create/update a target profile |

### Auto-Learned Skills
Skills created by the learning loop live in:
`.claude/skills/learned/hunt-[type].md`

They are automatically invoked when you search
for that vulnerability type. The more you use
them, the better they get.

## Memory System (Hermes-style)

Three persistent memory layers:

| File | Purpose | Updated By |
|------|---------|------------|
| MEMORY.md | Techniques, patterns, stats | /after-hunt, /learn |
| TARGETS.md | Target profiles & findings | /memory target, /after-hunt |
| CLAUDE.md | Pipeline config & instructions | Manual |

## Self-Improvement Loop

```
Hunt for bugs
    ↓
Find vulnerability
    ↓
/after-hunt (automatic)
    ↓
├→ Update MEMORY.md (new technique)
├→ Update TARGETS.md (new finding)
├→ Create/refine skill in learned/
└→ Cross-reference other targets
    ↓
Next hunt is faster + smarter
```

Every hunt makes the pipeline better.
Skills track their own success rate and
refine their search patterns over time.

## Quality Standards (from Claude Code source)

All agents now apply senior-security-engineer
rigor from Claude Code's `/security-review`:

### Confidence Threshold: >= 8/10
Findings below confidence 8 are dropped.
No noise, no speculation.

### 17 Hard Exclusions
DoS, rate limits, memory issues, test files,
log spoofing, path-only SSRF, regex injection,
documentation findings, outdated CVEs,
memory safety in safe languages, etc.

### 12 Precedents (Nuanced)
- React/Angular XSS-safe by default
- UUIDs unguessable → not IDOR
- Client-side auth checks → not vulns
- Environment variables → trusted
- Shell command injection rarely exploitable
- Logging URLs safe, logging secrets = vuln

This matches the bar of a senior security
engineer reviewing a PR — not a noisy scanner.

## Professional Hunt Workflow

The full pipeline for quality reports:

```
1. /recon target.com
   → map attack surface

2. /security-review [path]
   → find candidates (confidence >= 8)

3. /verify [finding]
   → bounty-verifier proves exploitation
   → VERDICT: EXPLOITABLE / NOT / PARTIAL

4. /report
   → only if EXPLOITABLE verdict
   → full HackerOne writeup with PoC

5. /after-hunt
   → capture technique
   → refine hunt-[type] skill
   → update MEMORY.md + TARGETS.md
```

**The `/verify` step is non-negotiable.**
Never submit findings you haven't exploited.
This is the difference between a $5000
bounty and a "Informative" close.
