---
description: >
  OWASP Top 10 checklist scan. Systematically
  checks each category using parallel agents.
  Usage: /checklist [target or path]
allowed_tools:
  - Agent
  - SendMessage
  - TodoWrite
  - Read
  - Grep
  - Glob
  - Bash
---

# OWASP Top 10 Checklist — Parallel Audit

Systematic OWASP Top 10 (2021) check using
parallel agents for maximum speed.

## Target

$ARGUMENTS

## Launch Parallel Agents

Launch **ALL 10 agents in parallel** (single
message with 10 Agent tool calls).
Each uses the **code-auditor** agent type.

### A01: Broken Access Control
```
Audit [target] for Broken Access Control.
Check: missing auth on endpoints, IDOR,
CORS misconfiguration, JWT flaws, privilege
escalation, metadata manipulation, forced
browsing. Report with CWE numbers.
```

### A02: Cryptographic Failures
```
Audit [target] for Cryptographic Failures.
Check: weak algorithms (MD5, SHA1), hardcoded
keys, missing encryption for sensitive data,
weak TLS config, predictable tokens, insecure
random number generation. Report with evidence.
```

### A03: Injection
```
Audit [target] for all Injection types.
Check: SQLi, NoSQL injection, command injection,
LDAP injection, XPath injection, SSTI, header
injection, ORM injection. Trace every user
input to dangerous sinks.
```

### A04: Insecure Design
```
Audit [target] for Insecure Design patterns.
Check: missing rate limiting, no account
lockout, missing CAPTCHA on sensitive actions,
trust boundary violations, missing threat
modeling for critical flows.
```

### A05: Security Misconfiguration
```
Audit [target] for Security Misconfiguration.
Check: default credentials, unnecessary features
enabled, verbose errors, missing security
headers, directory listing, debug mode in prod,
XML external entities (XXE).
```

### A06: Vulnerable Components
```
Audit [target] for Vulnerable Components.
Check: package.json/requirements.txt for known
CVEs, outdated frameworks, unmaintained deps,
components with known exploits. Use
`npm audit` or `pip-audit` if available.
```

### A07: Auth Failures
```
Audit [target] for Identification and
Authentication Failures.
Check: credential stuffing protection, weak
passwords allowed, missing MFA, session fixation,
session ID in URL, missing logout invalidation,
long-lived sessions.
```

### A08: Data Integrity Failures
```
Audit [target] for Software and Data Integrity
Failures. Check: insecure deserialization, CI/CD
pipeline security, auto-update without integrity
checks, unsigned serialized data, untrusted data
used in critical decisions.
```

### A09: Logging & Monitoring Failures
```
Audit [target] for Security Logging and
Monitoring Failures.
Check: sensitive data in logs, missing audit
trail for auth events, missing alerting for
brute force, no log integrity protection,
insufficient logging of security events.
```

### A10: SSRF
```
Audit [target] for Server-Side Request Forgery.
Check: URL parameters fetching resources,
webhook callbacks, file imports from URLs,
PDF generators, image processors, any feature
that makes server-side HTTP requests based
on user input. Check for allowlist bypass.
```

## Synthesis

After all 10 agents complete:

```markdown
# OWASP Top 10 Audit: [target]
# Date: [date]

| # | Category | Status | Findings |
|---|----------|--------|----------|
| A01 | Access Control | PASS/FAIL | N |
| A02 | Crypto Failures | PASS/FAIL | N |
| A03 | Injection | PASS/FAIL | N |
| A04 | Insecure Design | PASS/FAIL | N |
| A05 | Misconfig | PASS/FAIL | N |
| A06 | Vuln Components | PASS/FAIL | N |
| A07 | Auth Failures | PASS/FAIL | N |
| A08 | Integrity | PASS/FAIL | N |
| A09 | Logging | PASS/FAIL | N |
| A10 | SSRF | PASS/FAIL | N |

## Total: N findings
## Critical: N | High: N | Medium: N | Low: N
```

Save to:
`reports/[target]/owasp_checklist_[date].md`
