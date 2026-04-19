---
description: >
  OWASP Top 10 parallel audit. Spawns 10
  code-auditor agents in parallel, one per
  OWASP category, with progress tracking.
  Ported from Claude Code's /batch skill.
allowed_tools:
  - Agent
  - SendMessage
  - TodoWrite
  - Read
  - Grep
  - Glob
  - Bash
when_to_use: >
  Comprehensive OWASP Top 10 audit of a
  target or source tree. Triggers:
  "/checklist", "owasp scan", "full
  security audit", "check all top 10"
argument-hint: "[target URL or source path]"
---

# Checklist — OWASP Top 10 Parallel Audit

Systematically audit all OWASP Top 10 (2021)
categories in parallel. One agent per category.

## Target

$ARGUMENTS

If not provided, ask:
1. What's the target (URL / source / both)?
2. What's in scope?
3. Any categories to skip?

---

## Phase 1: Plan & Decompose

Before spawning agents, create a TodoWrite
with 10 items (A01-A10). This tracks parallel
progress.

```
- [ ] A01 Broken Access Control
- [ ] A02 Cryptographic Failures
- [ ] A03 Injection
- [ ] A04 Insecure Design
- [ ] A05 Security Misconfiguration
- [ ] A06 Vulnerable Components
- [ ] A07 Auth Failures
- [ ] A08 Data Integrity Failures
- [ ] A09 Logging & Monitoring Failures
- [ ] A10 SSRF
```

**Success criteria**: 10 todos created,
target scope confirmed.

---

## Phase 2: Spawn Parallel Workers

Launch **ALL 10 agents in a single message**
with 10 `Agent` tool calls. Each uses the
`code-auditor` agent type.

**Hard rule**: They MUST run in parallel, not
sequentially. One message, ten tool calls.

### A01: Broken Access Control
```
Audit [target] for Broken Access Control
(CWE-284, CWE-285, CWE-639).

Check:
- Missing auth on endpoints
- IDOR (numeric IDs in URLs)
- CORS misconfiguration
- JWT flaws (alg:none, weak secret)
- Privilege escalation paths
- Metadata manipulation
- Forced browsing

Apply Claude Code's 17 hard exclusions and
12 precedents. Report only confidence >= 8.
Use CWE numbers. Include file:line.
```

### A02: Cryptographic Failures
```
Audit [target] for Cryptographic Failures
(CWE-327, CWE-328, CWE-331).

Check:
- Weak algorithms: MD5, SHA1, DES, RC4
- Hardcoded keys / secrets
- Missing encryption for sensitive data
- Weak TLS config (TLSv1.0, RC4, CBC)
- Predictable tokens (Math.random)
- Insecure RNG

SKIP: password hashing debates, low-risk
crypto choices. Confidence >= 8 only.
```

### A03: Injection
```
Audit [target] for Injection
(CWE-89, CWE-78, CWE-77, CWE-94).

Check:
- SQLi (string concat in queries)
- NoSQL injection ($where, $ne operators)
- Command injection (exec, system, spawn)
- LDAP injection
- XPath injection
- SSTI (template rendering with user input)
- Header injection

Trace EVERY user input to dangerous sinks.
Apply Claude Code's React-safe-by-default
precedent. Confidence >= 8 only.
```

### A04: Insecure Design
```
Audit [target] for Insecure Design
(CWE-209, CWE-256, CWE-311).

Check:
- Missing rate limiting on sensitive endpoints
- No account lockout
- Missing CAPTCHA on login / password reset
- Trust boundary violations
- Missing threat modeling for critical flows
- Race conditions on money/state changes

SKIP generic DoS via rate limits (hard
exclusion #1). Only report exploitable
logic flaws.
```

### A05: Security Misconfiguration
```
Audit [target] for Security Misconfiguration
(CWE-16, CWE-2, CWE-611).

Check:
- Default credentials
- Unnecessary features enabled
- Verbose error messages (stack traces)
- Missing security headers
- Directory listing enabled
- Debug mode in production
- XXE in XML parsers

Confidence >= 8 only. Don't over-report
headers (CSP nuance = often low-risk).
```

### A06: Vulnerable Components
```
Audit [target] for Vulnerable Components
(CWE-1104, CWE-937).

Check:
- package.json / requirements.txt
- yarn.lock / package-lock.json
- Known CVEs (npm audit, pip-audit)
- Outdated frameworks
- Unmaintained deps
- Components with public exploits

SKIP: outdated CVEs (hard exclusion #9).
Only report if exploitable in current use
and version. Include CVE ID + severity.
```

### A07: Auth Failures
```
Audit [target] for Auth Failures
(CWE-287, CWE-384, CWE-521).

Check:
- Credential stuffing protection
- Weak password policy
- Missing MFA for admin
- Session fixation
- Session ID in URL
- Missing logout invalidation
- Long-lived sessions
- JWT: alg=none, weak secret, no exp

Apply hunt-auth-bypass skill patterns.
Confidence >= 8 only.
```

### A08: Data Integrity Failures
```
Audit [target] for Integrity Failures
(CWE-502, CWE-829).

Check:
- Insecure deserialization (pickle,
  yaml.load, Java ObjectInputStream,
  .NET BinaryFormatter)
- CI/CD pipeline security
- Auto-update without signature check
- Unsigned serialized data
- Untrusted data in critical decisions

Apply hunt-deserialization skill patterns.
Confidence >= 8 only. Include gadget chain
hypothesis.
```

### A09: Logging & Monitoring Failures
```
Audit [target] for Logging Failures
(CWE-778, CWE-532).

Check:
- Sensitive data in logs (passwords,
  tokens, PII)
- Missing audit trail for auth events
- Missing alerting for brute force
- No log integrity protection
- Insufficient security event logging

SKIP: log spoofing via user input
(hard exclusion #5). Only report actual
sensitive data leakage to logs.
```

### A10: SSRF
```
Audit [target] for SSRF
(CWE-918).

Check:
- URL parameters fetching resources
- Webhook callbacks
- File imports from URLs
- PDF / image generators
- Any server-side HTTP based on user input
- Allowlist bypass (DNS rebinding,
  decimal IP, IPv6 tricks)

Apply hunt-ssrf skill patterns. Test
for cloud metadata access
(169.254.169.254). Confidence >= 8.
```

---

## Phase 3: Track Progress

As each agent completes, update the TodoWrite.
Present a status table to the user:

```markdown
| # | Category | Status | Findings | Confidence |
|---|----------|--------|----------|------------|
| A01 | Access Control | ✓ done | 3 | 9, 8, 8 |
| A02 | Crypto | ✓ done | 0 | - |
| A03 | Injection | ⏳ running | - | - |
...
```

**Success criteria**: All 10 agents return.

---

## Phase 4: Synthesize Report

After all agents complete, merge into one
report:

```markdown
# OWASP Top 10 Audit: [target]
# Date: [YYYY-MM-DD]
# Methodology: Claude Code security-review
#   parallel scan (17 exclusions, 12 precedents,
#   confidence >= 8 threshold)

## Executive Summary
- Categories audited: 10
- Total findings (conf >= 8): N
- Critical: N | High: N | Medium: N
- Recommended first action: [top finding]

## Status Matrix

| # | Category | Status | Findings |
|---|----------|--------|----------|
| A01 | Access Control | PASS/FAIL | N |
| A02 | Crypto | PASS/FAIL | N |
| A03 | Injection | PASS/FAIL | N |
| A04 | Insecure Design | PASS/FAIL | N |
| A05 | Misconfig | PASS/FAIL | N |
| A06 | Vuln Components | PASS/FAIL | N |
| A07 | Auth Failures | PASS/FAIL | N |
| A08 | Integrity | PASS/FAIL | N |
| A09 | Logging | PASS/FAIL | N |
| A10 | SSRF | PASS/FAIL | N |

## Findings Detail

### [CATEGORY] — [Title]
- Severity: [CVSS]
- Confidence: [1-10, >=8]
- File: [path:line]
- CWE: [number]
- Description: [what]
- Evidence: [code snippet]
- Exploitation: [how]
- Recommended next step: /verify

## Next Steps

1. Run `/verify` on each finding
2. Only EXPLOITABLE verdicts → `/report`
3. NOT_EXPLOITABLE → log to MEMORY.md
4. Run `/after-hunt` to capture patterns
```

Save to:
`reports/[target]/owasp_checklist_[date].md`

---

## Rules

- **10 agents MUST run in parallel** (one
  message, ten Agent calls)
- **Confidence >= 8 is the floor** — drop
  anything lower without mentioning
- **Every finding needs file:line + CWE**
- **Don't write report until all 10 return**
- **Gate submission behind `/verify`** — no
  reports on unverified findings
