---
description: >
  Map individual findings into multi-stage
  attack chains for maximum impact and bounty.
  Uses the red-team agent to think in kill
  chains. Transforms $500 bugs into $15,000
  full-chain reports.
allowed_tools:
  - Agent
  - Read
  - Grep
  - Glob
  - Bash
  - TodoWrite
when_to_use: >
  After /analyze or /verify when you have
  multiple findings. Triggers: "/attack-chain",
  "chain these vulns", "what's the worst case",
  "red team this", "maximize impact",
  "full kill chain"
argument-hint: "[target or finding list]"
---

# Attack Chain — Red Team Impact Multiplier

Transform individual findings into multi-stage
attack chains. This is where bounty value
multiplies.

## Input

$ARGUMENTS

If not provided, gather findings from:
- `reports/[target]/analysis_*.md`
- `reports/[target]/verify_*.md`
- Recent `/security-review` output

## Why This Matters

```
Individual SQLi report      → $1,000
SQLi → credential dump
  → admin takeover
  → cloud compromise       → $15,000+

Same initial bug. Chain thinking = 15x payout.
```

---

## Phase 1: Gather All Findings

Read all available findings in parallel:

```bash
ls reports/*/analysis_*.md
ls reports/*/verify_*.md
```

Build the inventory:

| # | Finding | Type | Confidence | Verified? |
|---|---------|------|------------|-----------|
| 1 | SQLi on /search | Injection | 9 | EXPLOITABLE |
| 2 | IDOR on /api/users | Access | 8 | EXPLOITABLE |
| 3 | XSS on /comments | Client | 9 | EXPLOITABLE |
| ... | ... | ... | ... | ... |

**Success criteria**: Complete list of all
findings with types and verification status.

## Phase 2: Spawn Red Team Agent

```
Use the red-team agent to analyze these
findings for attack chains:

Findings:
[paste inventory table]

Target: [target]
Scope: [scope]

Map every possible chain through the kill
chain: initial access → execution →
persistence → priv escalation → lateral
movement → exfiltration → impact.

Prioritize by bounty potential.
```

## Phase 3: Verify Chain Links

For each chain the red-team agent proposes,
verify that the links actually connect:

### Link Verification Checklist

For Chain: [A → B → C]:

- [ ] Can Finding A's output actually feed
      into Finding B's input?
- [ ] Does the privilege level from A allow
      reaching B's endpoint?
- [ ] Is the data format from A compatible
      with B's requirements?
- [ ] Would real-world timing allow this
      chain? (sessions don't expire mid-chain?)
- [ ] Does any defense break the chain?
      (WAF, rate limit, MFA between steps?)

If a link breaks → the chain is invalid.
Don't submit fantasy chains.

## Phase 4: Write Chain Reports

For each verified chain, produce:

```markdown
# Attack Chain: [descriptive name]

## Summary
[One paragraph: what an attacker can achieve
by chaining these N findings together.]

## Severity Justification
Individual findings: [Medium/High]
Chained impact: [Critical]
"These findings individually are [severity],
but when chained together, an attacker can
achieve [critical impact] because [reason]."

## Kill Chain

### Step 1: Initial Access
- **Finding**: [type] on [endpoint]
- **Action**: [what the attacker does]
- **Gains**: [what they now have]
- **Evidence**: [verified probe output]

### Step 2: Escalation
- **Finding**: [type] on [endpoint]
- **Action**: [what the attacker does]
- **Gains**: [escalated access]
- **Evidence**: [verified probe output]

### Step 3: Impact
- **Finding**: [type] on [endpoint]
- **Action**: [what the attacker does]
- **Result**: [final impact]
- **Evidence**: [verified probe output]

## Business Impact
- Data at risk: [specific data types + scale]
- Affected users: [count / scope]
- Regulatory: [GDPR / HIPAA / PCI implications]
- Financial: [estimated damage]

## Proof of Concept
[End-to-end PoC that walks through all steps]

## Remediation
Breaking any single link stops the chain:
- Link 1 fix: [specific fix]
- Link 2 fix: [specific fix]
- Recommended: fix [most critical link] first
```

## Phase 5: Submission Strategy

Order your reports for maximum payout:

1. **Submit chains first** — higher severity,
   higher bounty
2. **Submit remaining individuals** — anything
   that doesn't chain
3. **Reference chains in individual reports** —
   "This finding is part of an attack chain
   described in report #[ID]"

### Timing Strategy
- Submit the chain report with full narrative
- Follow up with individual reports that
  reference the chain
- Some programs pay per-finding even in chains
  — submit each step individually too

---

## Common Chain Patterns

### XSS → Account Takeover
```
Stored XSS → steal session cookie
  → impersonate user → access sensitive data
```

### SSRF → Cloud Compromise
```
SSRF → read cloud metadata
  → extract IAM credentials → access S3/GCS
  → download customer data
```

### SQLi → Full Compromise
```
SQLi → extract credentials
  → crack/use hashes → admin login
  → access internal APIs → lateral movement
```

### IDOR → Mass Data Breach
```
IDOR on one resource → enumerate all IDs
  → bypass rate limiting → mass data scrape
  → PII/financial data exposure
```

### Auth Bypass → Privilege Escalation
```
Auth bypass → access user-level API
  → find admin endpoint without extra auth
  → admin panel access → data export
```

### Deserialization → RCE
```
Insecure deser → code execution
  → read config files → extract DB credentials
  → access database directly → full data access
```

---

## Rules

- **Only chain VERIFIED findings** — no
  theoretical chains
- **Verify each link** — can A's output
  actually reach B's input?
- **Rate at chain impact** — not individual
- **Write attack narratives** — triagers love
  stories they can follow
- **Submit chains AND individuals** — maximize
  total bounty
- **Authorized scope only** — always
