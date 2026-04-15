---
description: >
  Adversarial verification of a vulnerability
  finding. Sends actual payloads, proves
  exploitation with evidence. Produces
  VERDICT: EXPLOITABLE / NOT_EXPLOITABLE /
  PARTIAL. Use this before writing any bug
  bounty report.
allowed_tools:
  - Agent
  - Read
  - Grep
  - Glob
  - Bash
  - WebFetch
  - TodoWrite
when_to_use: >
  Run before submitting a bug bounty report
  to confirm exploitability. Triggers:
  "/verify", "verify this vuln", "prove it's
  exploitable", "can I submit this report?"
---

# Verify — Prove the Vuln Before Reporting

This skill enforces the rule: **never submit
a finding you haven't actually exploited.**

## User's Finding

$ARGUMENTS

If not provided, ask the user:
1. What vulnerability do you think you found?
2. Where is it (URL / endpoint / file:line)?
3. What's in scope?
4. Do you have test credentials?

---

## Core Principle

> Reading code is not verification.
> Send the payload.

A finding that "looks vulnerable" is worth
$0. A finding with a proven PoC is worth
the full bounty.

---

## Execution

### Step 1: Dispatch to bounty-verifier

```
Use the bounty-verifier agent to test this
finding:

Finding: [description]
Target: [URL/endpoint]
Type: [SQLi/XSS/SSRF/IDOR/Auth/Deserialize]
Scope: [what's in-scope]

Follow the adversarial probe methodology.
Run at least 3 probes. Include full request/
response for each. End with VERDICT: line.
```

### Step 2: Review the verdict

- **EXPLOITABLE** → Ready for `/report`
- **NOT_EXPLOITABLE** → Do NOT submit.
  Update TARGETS.md with "false positive"
  note to save future time.
- **PARTIAL** → Gather more info. Maybe
  request production test credentials from
  program. Do NOT submit yet.

### Step 3: Update memory

For EXPLOITABLE findings:
- Run `/after-hunt` to capture the technique
- Update the corresponding `hunt-[type]`
  skill with the working payload

For NOT_EXPLOITABLE findings:
- Add to MEMORY.md under "Common False
  Positives"
- Note what defense stopped the exploit
  (WAF rule, output encoding, etc.)
- Save future you from chasing this pattern

---

## Output to User

```markdown
# Verification Result

## Verdict: EXPLOITABLE / NOT_EXPLOITABLE / PARTIAL

## Evidence
[Full probe output from bounty-verifier]

## Next Step
- If EXPLOITABLE: Run /report to generate
  HackerOne submission
- If NOT_EXPLOITABLE: Skipped. Reason
  logged to MEMORY.md.
- If PARTIAL: [specific blocker + what's
  needed to proceed]
```
