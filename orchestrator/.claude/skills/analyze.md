---
description: >
  Vulnerability analysis pipeline. Runs parallel
  agents to audit code and test for OWASP Top 10.
  Usage: /analyze [target or path]
allowed_tools:
  - Agent
  - SendMessage
  - TodoWrite
  - Read
  - Grep
  - Glob
  - Bash
---

# Analyze Pipeline — Parallel Vulnerability Audit

You are orchestrating a vulnerability analysis
pipeline for authorized bug bounty testing.

## Target

The user wants to analyze: $ARGUMENTS

## Phase 1: Parallel Vulnerability Scanning

Launch these agents **in parallel** (single
message, multiple Agent tool calls):

### Agent 1: Injection Analysis
```
Use the code-auditor to scan for all
injection vulnerabilities in [target/path].

Focus on:
- SQL Injection (including ORM bypass)
- NoSQL Injection
- Command Injection
- LDAP / XPath Injection
- Template Injection (SSTI)
- Header Injection

For each finding, report:
- Exact file and line number
- Vulnerable code snippet
- The dangerous sink
- Whether input is sanitized
- Severity estimate
```

### Agent 2: Auth & Access Control
```
Use the code-auditor to audit authentication
and authorization in [target/path].

Focus on:
- Broken authentication flows
- Missing auth on endpoints
- JWT vulnerabilities
- Session management flaws
- Privilege escalation paths
- IDOR opportunities
- Insecure password handling

Map the complete auth flow and identify
every bypass opportunity.
```

### Agent 3: Data Exposure & SSRF
```
Use the code-auditor to find data exposure
and SSRF vulnerabilities in [target/path].

Focus on:
- SSRF in URL-fetching features
- Hardcoded secrets and API keys
- Sensitive data in logs
- Verbose error messages
- Debug endpoints in production
- Exposed internal APIs
- Insecure file operations (path traversal)

Report with exact locations and evidence.
```

### Agent 4: Client-Side & Logic Flaws
```
Use the code-auditor to audit client-side
security and business logic in [target/path].

Focus on:
- XSS (DOM, Reflected, Stored)
- CSRF without tokens
- Open redirects
- Clickjacking potential
- Race conditions (TOCTOU)
- Business logic bypass
- Rate limiting gaps
- Integer overflow in payments

Report with attack scenarios.
```

## Phase 2: Deep Dive on Findings

For each confirmed or likely vulnerability:
1. Spawn a **vuln-analyzer** agent to perform
   deep analysis
2. Run deep dives **in parallel** for
   independent findings
3. Assess CVSS score and bounty estimate

## Phase 3: Synthesis & Prioritization

After all agents complete:

1. **Deduplicate** — merge overlapping findings
2. **Rank by severity** — Critical → High →
   Medium → Low
3. **Rank by bounty potential** — which
   findings will pay the most?
4. **Identify chains** — can vulns be combined
   for higher impact?
5. **Create testing plan** — what PoCs to build

## Output

```markdown
# Vulnerability Analysis Report

## Summary
- Critical: N findings
- High: N findings
- Medium: N findings
- Low: N findings
- Estimated total bounty: $X,XXX - $XX,XXX

## Findings (by severity)

### [CRITICAL] Finding 1
...

### [HIGH] Finding 2
...

## Exploit Chains
...

## Recommended PoCs to Build
1. [highest value finding]
2. [second highest]
...
```

Save to `reports/[target]/analysis_[date].md`
