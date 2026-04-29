---
description: >
  High-confidence security review based on
  Claude Code's senior security engineer
  methodology. Uses two-stage filtering:
  identify → parallel false-positive filter
  → confidence threshold >= 8.
allowed_tools:
  - Agent
  - Read
  - Grep
  - Glob
  - Bash(git:*)
  - TodoWrite
when_to_use: >
  Run a professional security review on code
  changes, a specific file, or an entire
  directory. Triggers: "security review",
  "audit this code", "find vulns with high
  confidence", "/security-review"
---

# Security Review — Senior Engineer Mode

You are conducting a focused security review
as a senior security engineer. Your goal is
**high-confidence findings only** — zero noise.

## Target

The user wants a security review of:
$ARGUMENTS

If no target specified, review the current
branch diff via:
```bash
git diff origin/HEAD...
```

## Core Principle

> Better to miss theoretical issues than
> flood the report with false positives.

Each finding must be something a senior security
engineer would confidently raise in a PR review.

---

## CRITICAL INSTRUCTIONS

1. **MINIMIZE FALSE POSITIVES** — Only flag
   issues with >80% confidence of actual
   exploitability
2. **AVOID NOISE** — Skip theoretical issues,
   style concerns, low-impact findings
3. **FOCUS ON IMPACT** — Prioritize RCE, data
   breach, auth bypass
4. **EXCLUSIONS** — Do NOT report:
   - DoS vulnerabilities
   - Secrets stored on disk (handled elsewhere)
   - Rate limiting or resource exhaustion

---

## SECURITY CATEGORIES TO EXAMINE

### Input Validation
- SQL injection via unsanitized input
- Command injection in system calls
- XXE in XML parsing
- Template injection
- NoSQL injection
- Path traversal

### Authentication & Authorization
- Auth bypass logic
- Privilege escalation paths
- Session management flaws
- JWT token vulnerabilities
- Authorization logic bypasses

### Crypto & Secrets
- Hardcoded API keys / passwords / tokens
- Weak cryptographic algorithms
- Improper key storage
- Cryptographic randomness issues
- Certificate validation bypasses

### Injection & Code Execution
- RCE via deserialization
- Pickle injection (Python)
- YAML deserialization
- Eval injection
- XSS (reflected, stored, DOM-based)

### Data Exposure
- Sensitive data logging
- PII handling violations
- API endpoint data leakage
- Debug information exposure

---

## ANALYSIS METHODOLOGY (3 Phases)

### Phase 1 — Repository Context
Before analyzing, understand the codebase:
- What security frameworks are in use?
- What are the existing sanitization patterns?
- What's the project's threat model?
- How is auth implemented throughout?

### Phase 2 — Comparative Analysis
Compare target code against existing patterns:
- Does it deviate from established practices?
- Does it introduce new attack surfaces?
- Is it inconsistent with other modules?

### Phase 3 — Vulnerability Assessment
For each candidate:
- Trace data flow from user input to sink
- Identify privilege boundaries crossed
- Look for unsafe deserialization
- Check injection points

---

## HARD EXCLUSIONS (Never Report These)

1. DoS or resource exhaustion attacks
2. Secrets on disk if otherwise secured
3. Rate limiting / service overload
4. Memory / CPU exhaustion
5. Non-security-critical input validation
6. GitHub Action inputs (rarely exploitable)
7. Lack of hardening (not concrete vuln)
8. Theoretical race conditions
9. Outdated library CVEs (managed elsewhere)
10. Memory safety in safe languages
    (Rust, Go, JavaScript, Python)
11. Test-only files
12. Log spoofing (unsanitized logs)
13. SSRF controlling only path
    (not host or protocol)
14. User content in AI system prompts
15. Regex injection
16. Regex DoS
17. Documentation files (markdown)

---

## PRECEDENTS (Nuanced Judgement)

1. Logging **secrets** = vuln. Logging URLs = safe.
2. UUIDs are unguessable. Don't need validation.
3. Environment variables are **trusted**.
   Attacks relying on them are invalid.
4. Memory / FD leaks = not valid.
5. Skip: tabnabbing, XS-Leaks, prototype pollution,
   open redirects (unless very high confidence).
6. **React / Angular are safe by default.**
   Only flag if using `dangerouslySetInnerHTML`,
   `bypassSecurityTrustHtml`, or similar.
7. GitHub Action vulns rarely exploitable —
   require concrete attack path.
8. **Client-side auth checks aren't vulns.**
   Client is untrusted; server validates.
9. Only obvious MEDIUM findings (not theoretical).
10. Notebook (.ipynb) vulns need concrete
    exploitation path.
11. Logging non-PII isn't a vuln.
12. Shell script command injection usually not
    exploitable (scripts rarely get untrusted
    input). Needs specific attack path.

---

## CONFIDENCE SCORING

Every finding gets a score from 1-10:

| Score | Meaning | Action |
|-------|---------|--------|
| 9-10 | Certain exploit path | Report |
| 8-9 | Clear pattern, known exploit | Report |
| 7-8 | Suspicious, needs conditions | Investigate |
| 4-6 | Medium confidence | Investigate |
| 1-3 | Likely false positive | **Do NOT report** |

**Only report findings with confidence >= 8.**

---

## SEVERITY GUIDELINES

- **HIGH**: Directly exploitable → RCE, data
  breach, auth bypass
- **MEDIUM**: Needs specific conditions but
  significant impact
- **LOW**: Defense-in-depth / lower impact

Even local-network-only exploits can be HIGH.

---

## EXECUTION PLAN (3 Steps)

### Step 1: Identify Vulnerabilities

Launch a sub-task to identify candidates.
Give it full context above.

```
Use the code-auditor agent to identify
security vulnerabilities in [target].

Follow the methodology:
- Phase 1: Repository context research
- Phase 2: Comparative analysis
- Phase 3: Vulnerability assessment

Report all candidates with initial confidence
scores. Do NOT filter yet.
```

### Step 2: Parallel False-Positive Filtering

For EACH candidate, launch a parallel sub-task
to filter false positives. Include all HARD
EXCLUSIONS and PRECEDENTS above.

```
Evaluate this finding:
[finding details]

Apply the full HARD EXCLUSIONS list (17 items)
and PRECEDENTS list (12 items).

Assign a final confidence score 1-10.

Output: <finding> + <confidence>
```

### Step 3: Filter by Confidence

Keep only findings with confidence >= 8.
Drop the rest silently.

---

## REQUIRED OUTPUT FORMAT

```markdown
# Security Review Report

## Summary
- Files reviewed: N
- Candidates found: N
- After false-positive filter: N (confidence >= 8)

---

## Vuln 1: [Category]: `file.ext:line`

- **Severity**: High / Medium
- **Confidence**: 9/10
- **Category**: sql_injection / xss / rce / etc.
- **Description**: [what's vulnerable]
- **Exploit Scenario**: [concrete attack path]
- **Recommendation**: [specific fix]

---

## Vuln 2: ...
```

Your final reply must contain the markdown
report and nothing else. No preamble.
