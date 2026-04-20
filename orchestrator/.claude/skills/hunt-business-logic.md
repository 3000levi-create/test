---
name: hunt-business-logic
description: >
  Business logic vulnerability hunt. Race
  conditions (TOCTOU), multi-tenant confusion,
  workflow bypass, price/quantity manipulation,
  state machine abuse, coupon stacking,
  integer overflow, currency confusion. The
  "not in OWASP but pays Critical" bug class.
argument-hint: "[target.com]"
allowed_tools:
  - Agent
  - Read
  - Glob
  - Grep
  - Bash
---

# /hunt-business-logic — The Hidden $$$$

Business logic bugs don't fit OWASP. Scanners
can't find them. But they break the company's
business model — which is the most valuable
finding a bug hunter can report.

## Usage

```bash
claude "/hunt-business-logic target.com"
```

## Coverage (10 Classes)

1. **Race Conditions** — TOCTOU on coupons,
   refunds, votes, stock
2. **Multi-Tenant Confusion** — tenant_id
   swap, cookie scope, JWT tenant claim
3. **Workflow Bypass** — skip email verify,
   skip payment, skip KYC
4. **Price/Quantity Manipulation** — negative
   qty, >100% discount, currency swap
5. **State Machine Abuse** — cancel shipped,
   refund delivered, resubmit paid
6. **Coupon/Promo Abuse** — stacking, reuse,
   case variance, whitespace
7. **OAuth State Confusion** — replay, PKCE
   mismatch, scope elevation
8. **Referral/Reward Abuse** — self-refer,
   fake invites, loops
9. **Arithmetic/Logic Errors** — overflow,
   precision, off-by-one, signs
10. **Session/Context Confusion** — impersonate,
    multi-account bleed, feature flag bypass

## Testing Approach

- **Sandbox preferred** — real money = stop
- **Parallel requests** — burp turbo intruder
- **3x repro** — business logic bugs flake
- **Measure $ impact** — reports need it

## Spawns

`business-logic-auditor` agent.

## When to Use

- `/hunt-business-logic` = focused BL hunt
- `/hunt` runs this automatically for e-commerce
  and multi-tenant SaaS targets

## Rules

- Safe payloads, no destructive ops
- Real money scenarios → sandbox or stop
- Confidence >= 8 or drop
- Return JSON for orchestrator
