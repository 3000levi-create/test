# Bug Bounty Security Research Pipeline

## Overview

Multi-agent bug bounty pipeline built on
Claude Code's architecture. Self-improving:
every hunt makes the next one faster.

**AUTHORIZED TESTING ONLY.** Always operate
within the scope defined by the program.

## Quick Start

```bash
# Full pipeline
claude "/recon target.com"
claude "/analyze target.com"
claude "/verify [finding]"
claude "/report [finding]"
claude "/after-hunt"

# Strategy first (new targets)
claude "/plan-hunt target.com"

# OWASP parallel scan (10 agents)
claude "/checklist target.com"
```

## Professional Workflow

```
/plan-hunt target.com
    → strategy + priority targets
    ↓
/recon target.com
    → 4 parallel agents map attack surface
    ↓
/security-review [path]
    → senior-engineer code review (conf >= 8)
    ↓
/analyze [target]
    → 4 parallel auditors (injection, auth,
      data exposure, client-side)
    ↓
/verify [each finding]
    → bounty-verifier: adversarial probes
    → VERDICT: EXPLOITABLE / NOT / PARTIAL
    ↓
/report [EXPLOITABLE findings only]
    → HackerOne-grade writeup + PoC
    ↓
/after-hunt
    → update MEMORY.md + TARGETS.md
    → create/refine hunt-[type] skill
    → cross-reference other targets
```

**The /verify step is NON-NEGOTIABLE.**
Never submit findings you haven't exploited.
$5000 bounty vs "Informative" close.

## Red Team Methodology

This pipeline thinks like a penetration tester,
not a scanner. The difference:

```
Scanner mindset:  "Found XSS" → report → $500
Red team mindset: "Found XSS" → "what does
  this unlock?" → chain → admin takeover
  → full compromise → $15,000
```

### Kill Chain (every engagement)
```
RECON → INITIAL ACCESS → EXECUTION
  → PERSISTENCE → PRIV ESCALATION
  → LATERAL MOVEMENT → EXFILTRATION
  → IMPACT
```

### Red Team Workflow
```
/analyze target.com
    → individual findings
    ↓
/verify [each finding]
    → EXPLOITABLE + chain potential
    ↓
/attack-chain [target]
    → red-team agent maps kill chains
    → chains vulns for max impact
    ↓
/report [chain report]
    → full attack narrative
    → submit chain + individuals
```

### Key Red Team Thinking
- **"What does this unlock?"** — don't stop
  at first foothold
- **"Can this chain?"** — always look for
  multi-stage paths
- **"What's the worst case?"** — think like
  an APT, not a scanner
- **Post-exploitation** — what happens AFTER
  initial access?
- **Business logic** — race conditions,
  negative values, state confusion

### AD / Infrastructure Kill Chain
```
INITIAL FOOTHOLD → AD ENUMERATION
  → CREDENTIAL HARVESTING (Kerberoast, LSASS)
  → PRIVILEGE ESCALATION (ACL, AD CS, GPO)
  → LATERAL MOVEMENT (PtH, PtT, WinRM)
  → COERCION + RELAY (PetitPotam → AD CS)
  → DOMAIN DOMINANCE (DCSync, Golden Ticket)
  → PERSISTENCE (Silver Ticket, AdminSDHolder)
  → FOREST COMPROMISE (trust abuse, SID History)
```

Use the `ad-infra` agent for AD engagements.
It maps the full AD attack graph and finds
the shortest path to Domain Admin.

## Agents

| Agent | Purpose |
|-------|---------|
| **red-team** | **Kill chain operator. Chains vulns into multi-stage attacks. Post-exploitation + lateral movement** |
| **ad-infra** | **AD/infrastructure red team. Kerberos, coercion, SCCM, ACL abuse, delegation, domain dominance** |
| recon-agent | READ-ONLY. Subdomains, endpoints, tech fingerprinting |
| code-auditor | Source review. 17 exclusions, 12 precedents, conf >= 8. Red team lens |
| vuln-analyzer | Deep-dive per vuln class. Chain potential + kill chain position |
| bounty-verifier | Adversarial verification. VERDICT + post-exploitation + chain potential |
| exploit-writer | Safe PoC development. Gated behind EXPLOITABLE verdict |
| report-writer | HackerOne reports. Gated behind EXPLOITABLE verdict |
| learner | Self-improving: learns from hunts, creates/refines skills |

## Skills

### Hunting Pipeline
| Skill | What It Does |
|-------|-------------|
| /recon | 4 parallel recon-agents → attack surface map |
| /analyze | 4 parallel code-auditors → vuln candidates |
| /security-review | Senior-engineer review (17 exclusions, 12 precedents) |
| /checklist | 10 parallel agents — one per OWASP Top 10 category |
| /verify | Adversarial exploit verification → VERDICT |
| /report | HackerOne report (only after EXPLOITABLE) |

### Red Team & Strategy
| Skill | What It Does |
|-------|-------------|
| /attack-chain | Chain findings into multi-stage kill chains. Bounty multiplier |
| /plan-hunt | Read-only hunt strategy designer. Priority targets + execution plan |

### Self-Learning Loop
| Skill | What It Does |
|-------|-------------|
| /learn | Capture technique as skill (4-round interview) |
| /after-hunt | Post-hunt feedback loop (memory + skills + cross-ref) |
| /memory | Review & manage persistent knowledge |
| /memory target [name] | Create/update target profile |
| /memory search [query] | Search across all memory layers |
| /memory stats | Pipeline health dashboard |

### Auto-Learned Skills
Live in `.claude/skills/learned/hunt-[type].md`.
Auto-invoked when hunting that vuln class.
Self-refining: success counters + changelogs.

Current skills:

**Web Application:**
- hunt-idor — Numeric ID enumeration
- hunt-ssrf — URL fetchers, webhooks, PDF gen
- hunt-sqli — SQL injection patterns
- hunt-xss — XSS (React-safe precedent)
- hunt-auth-bypass — JWT, session, privesc
- hunt-deserialization — Multi-language unsafe deser

**Active Directory / Infrastructure:**
- hunt-kerberos — Kerberoasting, AS-REP, Golden/Silver Ticket, delegation abuse
- hunt-coercion — PetitPotam, PrinterBug, DFSCoerce, ShadowCoerce + NTLM relay
- hunt-sccm — SCCM/MECM: NAA theft, PXE abuse, hierarchy takeover, client push
- hunt-ad-privesc — ACL abuse, DCSync, AD CS (ESC1-8), GPO abuse, trust abuse
- hunt-lateral-movement — PtH, PtT, DCOM, WinRM, PSExec, credential dumping

## Memory System

Four persistent layers:

| Layer | File | Updated By |
|-------|------|------------|
| Techniques | MEMORY.md | /after-hunt, /learn |
| Targets | TARGETS.md | /after-hunt, /memory target |
| Learned skills | .claude/skills/learned/ | /learn, /after-hunt, learner |
| Pipeline config | CLAUDE.md | Manual only |

## Quality Standards

Ported from Claude Code's security-review:

### Confidence Threshold: >= 8/10
Drop anything below 8. No noise.

### 17 Hard Exclusions
1. DoS / resource exhaustion
2. Rate limiting absence
3. Memory issues in safe languages
4. Test file findings
5. Log spoofing via user input
6. Path-only SSRF (no network)
7. Regex injection (ReDoS)
8. Missing security headers (generic)
9. Outdated CVEs (not exploitable)
10. Info disclosure (version strings)
11. CORS on public endpoints
12. Missing cookie flags (generic)
13. Clickjacking on non-sensitive pages
14. Open redirect (low-impact)
15. Username enumeration
16. SSL/TLS config (generic)
17. Documentation-only findings

### 12 Precedents
1. React/Angular: XSS-safe by default
2. UUIDs: unguessable → not IDOR
3. Client-side auth: not a vuln
4. Environment variables: trusted
5. Shell injection: rarely exploitable
6. Logging URLs: safe (secrets = vuln)
7. Prepared statements: safe from SQLi
8. CSRF tokens: framework-handled
9. Memory-safe languages: no BOF
10. Type-safe ORMs: safe from injection
11. Signed cookies: tamper-resistant
12. OAuth state param: framework-handled

## Self-Improvement Loop

```
Hunt → Find (or fail) → /after-hunt
    ↓
├→ MEMORY.md: +1 technique or false positive
├→ TARGETS.md: finding + session logged
├→ hunt-[type].md: created or refined
└→ Cross-reference: flag similar targets
    ↓
Next hunt is faster + smarter
```

Every hunt feeds the loop. Even failed hunts
teach the pipeline what to skip next time.

## Hard Rules

1. **Authorized scope only** — always
2. **No reports without /verify** — always
3. **Confidence >= 8** — or drop it
4. **Safe payloads only** — alert(), id, version()
5. **No data exfil beyond proof** — show access, stop
6. **Preserve history** — append, don't overwrite
7. **Cross-reference always** — connections multiply ROI
