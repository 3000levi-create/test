---
description: >
  Generate a professional HackerOne/Bugcrowd
  report from vulnerability findings.
  Usage: /report [vuln description or file]
allowed_tools:
  - Agent
  - Read
  - Write
  - Glob
  - Grep
  - WebSearch
---

# Report Pipeline — Professional Bug Bounty Report

You are generating a bug bounty report.

## Input

$ARGUMENTS

## Process

### Step 1: Gather Context

Read any existing analysis files:
```
reports/*/analysis_*.md
reports/*/recon_*.md
```

### Step 2: Generate Report

Spawn the **report-writer** agent with:
- All vulnerability findings
- Evidence and code snippets
- CVSS scores
- Reproduction steps

### Step 3: Generate PoC (if needed)

If the vulnerability needs a PoC, spawn
the **exploit-writer** agent to create a
minimal, safe proof of concept.

### Step 4: Quality Check

Verify the report includes:
- [ ] Clear one-paragraph summary
- [ ] Exact reproduction steps
- [ ] HTTP request/response examples
- [ ] CVSS score with justification
- [ ] Impact description
- [ ] PoC script or commands
- [ ] Remediation suggestion
- [ ] Screenshots (if applicable)

### Step 5: Save

Save the final report to:
`reports/[target]/[date]_[vuln-type]_report.md`

And the PoC to:
`reports/[target]/poc/poc_[vuln-type].py`
