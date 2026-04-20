# Bug Bounty Security Research Pipeline

## Overview

Autonomous multi-agent bug bounty pipeline.
One command (`/hunt target.com`) runs the
full engagement end-to-end. Agents make
decisions, spawn sub-agents, chain results.
Self-improving: every hunt makes the next
one faster.

**AUTHORIZED TESTING ONLY.** Always operate
within the scope defined by the program.

## Quick Start

```bash
# One command — full autonomous pipeline
claude "/hunt target.com"

# Or run individual phases
claude "/surface-map target.com"
claude "/threat-emulate target.com"
claude "/analyze target.com"
claude "/hunt-api target.com"
claude "/hunt-business-logic target.com"
claude "/hunt-auth-deep target.com"
claude "/verify [finding]"
claude "/post-exploit-web [finding]"
claude "/hunt-cloud [finding]"
claude "/hunt-evasion [finding]"
claude "/attack-chain target.com"
claude "/report [finding]"
claude "/after-hunt"
```

## Autonomous Pipeline (/hunt)

```
/hunt target.com
    ↓
hunt-orchestrator (decides everything)
    ↓
PHASE 1: Recon + OSINT + Threat (parallel)
  ├─ surface-mapper
  ├─ osint
  └─ threat-emulator  ← picks APT playbook
    ↓
PHASE 2: Analysis (7 parallel auditors)
  ├─ code-auditor × 4 (injection / auth /
  │                    exposure / client)
  ├─ api-auditor (GraphQL / gRPC / REST)
  ├─ business-logic-auditor
  └─ auth-deep-auditor (OAuth / SAML / JWT)
    ↓
PHASE 3: Verify (parallel per finding)
  └─ bounty-verifier × N
    ↓
PHASE 4: Chain + Pivot (conditional)
  ├─ red-team (always)
  ├─ cloud-pivot (if SSRF in chain)
  └─ post-exploit-web (if admin in chain)
    ↓
PHASE 5: Evasion + OPSEC (conditional)
  ├─ evasion-operator (if WAF blocks)
  └─ opsec-operator (review before prod)
    ↓
PHASE 6: Report + Memory
  ├─ report-writer (MITRE ATT&CK mapped)
  └─ learner (update MEMORY + skills)
```

**No human intervention between phases.**
Orchestrator decides autonomously based on
findings.

## Red Team Methodology

Not a scanner. Not a pentester. Red teamer.

```
Scanner:  "Found XSS" → report → $500
Pentester: "Found XSS + impact" → $2,000
Red team: "XSS → admin session → webhook →
  exfil all PII → SSO pivot → org-wide"
  → $50,000
```

### External Kill Chain
```
SURFACE MAP → OSINT → THREAT MODEL
  → ANALYSIS → VERIFY → CHAIN
  → CLOUD PIVOT → POST-EXPLOIT
  → EVASION → REPORT
```

### AD / Infrastructure Kill Chain
```
INITIAL FOOTHOLD → AD ENUMERATION
  → CREDENTIAL HARVESTING (Kerberoast, LSASS)
  → PRIVILEGE ESCALATION (ACL, AD CS, GPO)
  → LATERAL MOVEMENT (PtH, PtT, WinRM)
  → COERCION + RELAY (PetitPotam → AD CS)
  → DOMAIN DOMINANCE (DCSync, Golden Ticket)
  → PERSISTENCE (Silver Ticket, AdminSDHolder)
  → FOREST COMPROMISE (trust abuse, SID History)
```

### Red Team Thinking
- **"What does this unlock?"** — don't stop
  at first foothold
- **"Can this chain?"** — multi-stage paths
- **"What's the worst case?"** — APT mindset
- **"How does this look in logs?"** — OPSEC
- **"What MITRE ATT&CK ID?"** — purple team
- **Post-exploitation** — what happens AFTER
- **Business logic** — race, state, price

## Agents (18 total)

### Master Coordinator
| Agent | Purpose |
|-------|---------|
| **hunt-orchestrator** | **Autonomous master. Full pipeline, spawns all sub-agents, decides everything** |

### Intelligence / Recon
| Agent | Purpose |
|-------|---------|
| **surface-mapper** | **GitHub dorks, S3 buckets, mobile backends, subdomain takeover, API spec** |
| **osint** | **Tech stack, vendors, breach data correlation, threat profile** |
| **threat-emulator** | **APT playbook selection + MITRE ATT&CK mapping** |
| recon-agent | Basic passive recon (legacy) |

### Analysis
| Agent | Purpose |
|-------|---------|
| code-auditor | Source review (17 exclusions, 12 precedents) |
| **api-auditor** | **OWASP API Top 10: GraphQL, gRPC, REST, WebSocket** |
| **business-logic-auditor** | **Race, TOCTOU, multi-tenant, workflow, price** |
| **auth-deep-auditor** | **OAuth/SAML/JWT/MFA/session deep dive** |
| vuln-analyzer | Deep-dive per vuln class |

### Verification + Exploitation
| Agent | Purpose |
|-------|---------|
| bounty-verifier | Adversarial verification → VERDICT |
| **red-team** | **Kill chain operator, post-exploit chaining** |
| **cloud-pivot** | **SSRF → AWS/Azure/GCP, IAM privesc, STS chains** |
| **post-exploit-web** | **Persistence, SSO pivot, blast radius mapping** |
| ad-infra | AD red team (Kerberos, coercion, SCCM) |
| exploit-writer | Safe PoC development |

### OPSEC + Evasion
| Agent | Purpose |
|-------|---------|
| **evasion-operator** | **WAF/bot/rate-limit bypass for PoC work** |
| **opsec-operator** | **Detection-aware tradecraft, pre-action review** |

### Reporting + Learning
| Agent | Purpose |
|-------|---------|
| report-writer | HackerOne reports + MITRE mapping |
| learner | Self-improving: learns from hunts |

## Skills (20 total)

### Master
| Skill | What It Does |
|-------|-------------|
| **/hunt** | **One-command autonomous pipeline** |

### Recon + Intelligence
| Skill | What It Does |
|-------|-------------|
| **/surface-map** | **Advanced recon: GitHub, S3, mobile, takeovers** |
| /recon | Basic 4-parallel recon (legacy) |
| **/threat-emulate** | **APT playbook + MITRE ATT&CK** |

### Analysis
| Skill | What It Does |
|-------|-------------|
| /analyze | 4 parallel code-auditors |
| **/hunt-api** | **OWASP API Top 10 hunt** |
| **/hunt-business-logic** | **Race, TOCTOU, state, price** |
| **/hunt-auth-deep** | **OAuth/SAML/JWT/MFA** |
| /security-review | Senior-engineer review |
| /checklist | 10 parallel OWASP agents |

### Verify + Chain + Pivot
| Skill | What It Does |
|-------|-------------|
| /verify | Adversarial exploit verification |
| /attack-chain | Chain findings into kill chains |
| **/hunt-cloud** | **SSRF → cloud → IAM privesc** |
| **/post-exploit-web** | **Persistence, SSO pivot, blast radius** |

### Evasion
| Skill | What It Does |
|-------|-------------|
| **/hunt-evasion** | **WAF / bot / rate-limit bypass** |

### Reporting + Planning
| Skill | What It Does |
|-------|-------------|
| /report | HackerOne report + MITRE ATT&CK |
| /plan-hunt | Read-only hunt strategy |

### Memory
| Skill | What It Does |
|-------|-------------|
| /learn | Capture technique as skill |
| /after-hunt | Post-hunt feedback loop |
| /memory | Review persistent knowledge |

### Auto-Learned (hunt-[type].md)

**Web Application:**
- hunt-idor — Numeric ID enumeration
- hunt-ssrf — URL fetchers, webhooks
- hunt-sqli — SQL injection patterns
- hunt-xss — XSS (React-safe precedent)
- hunt-auth-bypass — JWT, session, privesc
- hunt-deserialization — Multi-lang unsafe deser

**Active Directory / Infrastructure:**
- hunt-kerberos — Kerberoasting, AS-REP, Golden/Silver
- hunt-coercion — PetitPotam, PrinterBug, NTLM relay
- hunt-sccm — SCCM/MECM attacks
- hunt-ad-privesc — ACL, DCSync, AD CS (ESC1-8), GPO
- hunt-lateral-movement — PtH, PtT, DCOM, WinRM

## MITRE ATT&CK Integration

Every finding mapped to ATT&CK technique IDs:

- T1190 (Exploit Public-Facing App)
- T1552.005 (Cloud Instance Metadata API)
- T1528 (Steal Application Access Token)
- T1539 (Steal Web Session Cookie)
- T1556.007 (Hybrid Identity)
- T1606.001 (Forge Web Cookies)
- T1606.002 (Forge SAML Tokens)
- T1550.001 (Application Access Token)
- T1550.004 (Web Session Cookie)
- T1558 (Steal/Forge Kerberos Tickets)
- T1110 (Brute Force)
- T1526 (Cloud Service Discovery)
- T1530 (Data from Cloud Storage)
- T1213 (Data from Info Repositories)
- T1567 (Exfil Over Web Service)

## Memory System

Four persistent layers:

| Layer | File | Updated By |
|-------|------|------------|
| Techniques | MEMORY.md | /after-hunt, /learn |
| Targets | TARGETS.md | /after-hunt, /memory target |
| Learned skills | .claude/skills/learned/ | /learn, /after-hunt |
| Pipeline config | CLAUDE.md | Manual |

## Quality Standards

### Confidence Threshold: >= 8/10
Drop anything below 8. No noise.

### 17 Hard Exclusions
1. DoS / resource exhaustion
2. Rate limiting absence
3. Memory issues in safe languages
4. Test file findings
5. Log spoofing via user input
6. Path-only SSRF (no network)
7. Regex injection (ReDoS)
8. Missing security headers (generic)
9. Outdated CVEs (not exploitable)
10. Info disclosure (version strings)
11. CORS on public endpoints
12. Missing cookie flags (generic)
13. Clickjacking on non-sensitive pages
14. Open redirect (low-impact)
15. Username enumeration
16. SSL/TLS config (generic)
17. Documentation-only findings

### 12 Precedents
1. React/Angular: XSS-safe by default
2. UUIDs: unguessable → not IDOR
3. Client-side auth: not a vuln
4. Environment variables: trusted
5. Shell injection: rarely exploitable
6. Logging URLs: safe (secrets = vuln)
7. Prepared statements: safe from SQLi
8. CSRF tokens: framework-handled
9. Memory-safe languages: no BOF
10. Type-safe ORMs: safe from injection
11. Signed cookies: tamper-resistant
12. OAuth state param: framework-handled

## OPSEC Defaults

Every `/hunt` includes OPSEC review:

- **Green:** passive recon, browsing, cookie
  replay, valid creds
- **Orange:** GraphQL introspection, OPTIONS,
  TLS probing
- **Red:** nmap, dirb, sqlmap default, Burp
  active scan, parallel auth spray

## Self-Improvement Loop

```
Hunt → Find (or fail) → /after-hunt
    ↓
├→ MEMORY.md: +1 technique or false positive
├→ TARGETS.md: finding + session logged
├→ hunt-[type].md: created or refined
└→ Cross-reference: flag similar targets
    ↓
Next hunt is faster + smarter
```

## Hard Rules

1. **Authorized scope only** — always
2. **No reports without /verify** — always
3. **Confidence >= 8** — or drop
4. **Safe payloads only** — alert(), id, version()
5. **No data exfil beyond proof** — access, stop
6. **Preserve history** — append, don't overwrite
7. **Cross-reference always**
8. **Clean up everything you plant** — webhooks,
   keys, OAuth apps, accounts
9. **OPSEC review before production runs**
10. **MITRE ATT&CK map every finding**
