---
description: >
  Generate a professional HackerOne/Bugcrowd
  report from a VERIFIED finding. Gated behind
  /verify — refuses to write reports for
  unverified findings.
allowed_tools:
  - Agent
  - Read
  - Write
  - Glob
  - Grep
  - WebSearch
when_to_use: >
  After /verify returns VERDICT: EXPLOITABLE.
  Triggers: "/report", "write the h1 report",
  "generate bounty submission"
argument-hint: "[finding description or file]"
---

# Report Pipeline — Bug Bounty Report Generator

Generate a professional, bounty-maximizing
HackerOne/Bugcrowd report.

## Input

$ARGUMENTS

If not provided, ask:
1. Which finding (file / description)?
2. Has it been verified? (Show verdict)
3. Target + program name?

## HARD GATE

**Refuse to proceed unless:**
- VERDICT: EXPLOITABLE exists from
  bounty-verifier
- PoC artifact available
- Program scope confirmed

If any missing → redirect to `/verify` first.

## Process

### Step 1: Gather Context

Read in parallel:
- `reports/[target]/analysis_*.md`
- `reports/[target]/recon_*.md`
- `reports/[target]/verify_*.md` (verdict)
- `reports/[target]/poc/` (PoC artifact)
- TARGETS.md for program info

### Step 2: Verify the Verdict

Check that the bounty-verifier output
contains:
- `VERDICT: EXPLOITABLE`
- Full request/response probes (>= 3)
- Evidence of impact

If verdict is NOT_EXPLOITABLE:
- Do NOT write a report
- Redirect user: "This finding was not
  verified. Do not submit."

If verdict is PARTIAL:
- Do NOT write a report yet
- Ask: what's the blocker? Can we get
  test credentials from the program?

### Step 3: Generate PoC (if needed)

If no PoC exists, spawn `exploit-writer`:
```
Use the exploit-writer to create a safe
PoC for this VERIFIED finding:
[finding details + verdict]
```

### Step 4: Generate Report

Spawn `report-writer`:
```
Use the report-writer to generate a
HackerOne report for:

Finding: [type]
Target: [URL]
Verdict: EXPLOITABLE (from bounty-verifier)
Evidence: [verify log]
PoC: [path to poc script]
CWE: [number]
CVSS: [vector]

Use the professional template. Include
severity justification and remediation.
```

### Step 5: Quality Check

Before saving, verify the report has:
- [ ] Clear one-paragraph summary
- [ ] Exact reproduction steps (< 5 min)
- [ ] HTTP request/response examples
- [ ] CVSS score + vector with justification
- [ ] Impact description in business terms
- [ ] Working PoC script or commands
- [ ] Specific remediation suggestion
- [ ] CWE reference
- [ ] Screenshots (if applicable)
- [ ] Verifier output attached

Run the "triager test":
1. Understood in 60 seconds?
2. Reproducible in < 5 minutes?
3. Severity justified without drama?
4. Fix actionable?

If "no" to any → revise before save.

### Step 6: Save

Save to:
`reports/[target]/[date]_[vuln-type]_report.md`

PoC to:
`reports/[target]/poc/poc_[vuln-type].py`

Verifier evidence to:
`reports/[target]/evidence/verify_[date].log`

### Step 7: Submission Checklist

Before the user submits to HackerOne:
- [ ] Scope confirmed in program policy
- [ ] No duplicates (search H1 first)
- [ ] Report polished via triager test
- [ ] PoC tested end-to-end
- [ ] CVSS score matches impact
- [ ] Program's preferred format followed

### Step 8: Post-Submission

After submission:
1. Archive copy to
   `reports/[target]/submitted/[h1-id]_*.md`
2. Update TARGETS.md Findings table
3. Run `/after-hunt` to capture the
   technique into a learned skill

## Rules

- **NEVER write reports for unverified
  findings**
- **NEVER overstate severity**
- **NEVER include data exfiltrated beyond
  proof**
- **NEVER submit out-of-scope findings**
- **ALWAYS run the triager test**
