---
name: threat-emulate
description: >
  APT threat actor emulation. Picks the right
  threat actor playbook for the target profile
  (APT29, APT41, FIN7, Lazarus, Scattered
  Spider), maps planned actions to MITRE ATT&CK
  technique IDs, flavors the engagement for
  purple-team reporting.
argument-hint: "[target.com]"
allowed_tools:
  - Agent
  - Read
  - Glob
  - Grep
  - WebFetch
  - WebSearch
---

# /threat-emulate — APT Playbook Selection

Generic red team = generic report. Emulating
a real APT = defenders learn what to prepare
for.

## Usage

```bash
claude "/threat-emulate target.com"
```

## Threat Actor Profiles

### APT29 (Cozy Bear)
- Gov, defense, pharma, IT providers
- Patient, stealth, OAuth abuse, token
  theft, supply chain

### APT41
- Healthcare, telecom, tech, gaming
- N-day exploitation, credential harvest

### FIN7 / Carbanak
- Retail, hospitality, payment
- Business logic, POS, financial fraud

### Lazarus (DPRK)
- Crypto exchanges, banks, defense
- Supply chain, watering hole, custom malware

### Scattered Spider (UNC3944)
- Telecom, SaaS, retail
- Social engineering, SIM swap, MFA bombing,
  Okta abuse

### Cl0p / BlackCat / LockBit
- Manufacturing, healthcare
- Mass N-day (MOVEit, GoAnywhere, Citrix)
- Double extortion

## Output

Structured playbook with:
- Selected threat actor
- Rationale (why this actor for this target)
- Phase-by-phase TTP map (MITRE IDs)
- Priority auditors to spawn
- Purple team notes (detection gaps + defenses)

## Spawns

`threat-emulator` agent.

## When to Use

- Start of engagement — sets tone
- Run automatically in `/hunt` pipeline
  Phase 1

## Rules

- Pick ONE actor per engagement
- Map every finding to ATT&CK ID
- No destructive TTPs (same patterns,
  non-destructive impact)
- Document gaps for defenders
