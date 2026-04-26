---
description: >
  Parallel vulnerability analysis. Spawns 4
  code-auditor agents across injection,
  auth/access, data exposure/SSRF, and
  client-side/logic. Applies Claude Code's
  17 exclusions + 12 precedents + confidence
  >= 8 filter.
allowed_tools:
  - Agent
  - SendMessage
  - TodoWrite
  - Read
  - Grep
  - Glob
  - Bash
when_to_use: >
  After /recon, before /verify. Triggers:
  "/analyze", "audit this source",
  "find vulns in [path]"
argument-hint: "[target URL or source path]"
---

# Analyze Pipeline — Parallel Vuln Audit

Orchestrate parallel vulnerability analysis
with senior-engineer rigor.

## Target

$ARGUMENTS

If not provided, ask for target + scope.

## Quality Standards Applied

All agents apply Claude Code's:
- 17 hard exclusions (DoS, rate limits,
  memory in safe langs, log spoofing, etc.)
- 12 precedents (React-safe XSS, UUIDs not
  IDOR, client-side auth not a vuln, etc.)
- Confidence threshold >= 8/10
- Evidence-based reporting only

## Phase 1: Parallel Vulnerability Scanning

Launch these 4 agents **in parallel** (single
message, 4 Agent tool calls). All use the
`code-auditor` agent type.

### Agent 1: Injection
```
Use the code-auditor to scan for injection
vulns in [target/path].

Focus:
- SQL Injection (incl ORM bypass)
- NoSQL Injection
- Command Injection
- LDAP / XPath Injection
- SSTI (template injection)
- Header Injection

Apply hunt-sqli skill if present. Confidence
>= 8 only. Report file:line + CWE.
```

### Agent 2: Auth & Access Control
```
Use the code-auditor to audit auth/authz
in [target/path].

Focus:
- Broken auth flows
- Missing auth on endpoints
- JWT flaws (alg:none, weak secret)
- Session management
- Privilege escalation
- IDOR (numeric IDs, not UUIDs)
- Insecure password handling

Apply hunt-idor + hunt-auth-bypass skills.
SKIP: UUIDs as IDOR (precedent #6).
Confidence >= 8 only.
```

### Agent 3: Data Exposure & SSRF
```
Use the code-auditor to find data exposure
+ SSRF in [target/path].

Focus:
- SSRF in URL fetchers, webhooks,
  PDF/image generators
- Hardcoded secrets / API keys
- Sensitive data in logs
- Verbose errors
- Debug endpoints in prod
- Path traversal in file ops

Apply hunt-ssrf skill. SKIP: path-only
SSRF (exclusion #6). Confidence >= 8.
```

### Agent 4: Client-Side & Logic
```
Use the code-auditor to audit client-side
+ logic flaws in [target/path].

Focus:
- XSS (DOM/Reflected/Stored)
- CSRF without tokens
- Open redirects
- Race conditions (TOCTOU on money/state)
- Business logic bypass
- Integer overflow in payments

Apply hunt-xss skill. SKIP: React/Angular
XSS-safe-by-default (precedent #1).
Confidence >= 8 only.
```

## Phase 2: Deep Dive

For each finding at confidence >= 8:
1. Spawn a `vuln-analyzer` agent per finding
2. Run deep dives **in parallel** for
   independent findings
3. Assess CVSS 3.1 vector + bounty estimate
4. Look for exploit chains (combine findings)

## Phase 3: Synthesis

After all agents return:
1. **Deduplicate** overlapping findings
2. **Rank by severity**: Critical → Low
3. **Rank by bounty potential**
4. **Identify exploit chains**
5. **Build candidate list for /verify**

## Output

```markdown
# Vulnerability Analysis Report
# Target: [target]
# Date: [YYYY-MM-DD]
# Methodology: Claude Code-style review
#   (17 exclusions, 12 precedents, conf >= 8)

## Summary
- Critical: N
- High: N
- Medium: N
- Total (conf >= 8): N
- Est bounty range: $X,XXX - $XX,XXX

## Findings (by severity)

### [CRITICAL] Finding 1
- File: path:line
- CWE: XXX
- Confidence: 9/10
- CVSS: X.X
- Evidence: [code snippet]
- Exploitability: [how]
- Status: UNVERIFIED — send to /verify

### [HIGH] Finding 2
...

## Candidate List for /verify
1. [finding] — expected verdict: EXPLOITABLE
2. [finding] — expected verdict: PARTIAL
3. [finding] — expected verdict: EXPLOITABLE

## Exploit Chains
- [finding A] + [finding B] → [higher impact]

## Next Steps

1. /verify [each candidate]
2. Only EXPLOITABLE → /report
3. NOT_EXPLOITABLE → log to MEMORY.md
   as false positive + what stopped us
```

Save to: `reports/[target]/analysis_[date].md`

## Hard Gate

**Every finding must go through `/verify`
before `/report`.** Never submit without
VERDICT: EXPLOITABLE.
