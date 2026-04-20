---
name: hunt-cloud
description: >
  Cloud infrastructure pivot. After SSRF or
  credential leak, enumerates AWS/Azure/GCP
  IAM, maps privesc paths, identifies
  sensitive resources. Never exfils data
  beyond proof. Maps to MITRE ATT&CK cloud
  techniques.
argument-hint: "[entry finding or cloud creds]"
allowed_tools:
  - Agent
  - Read
  - Glob
  - Grep
  - Bash
  - WebFetch
---

# /hunt-cloud — SSRF → Cloud → Data

Bug that only reaches localhost is $500.
Same bug pivoting to AWS metadata, stealing
IAM role, reading backup S3 is $50,000.

## Usage

```bash
claude "/hunt-cloud [entry]"
# Examples:
claude "/hunt-cloud API-003"  # from finding
claude "/hunt-cloud 'leaked AWS key in JS'"
```

## Cloud Coverage

### AWS
- IMDSv1 + IMDSv2 access patterns
- STS credential extraction
- IAM enumeration (policies, roles)
- 20+ known privesc paths (Rhino Labs)
- S3 / DynamoDB / RDS / Secrets enum
- Cross-account pivot (assume-role)
- Organizations discovery

### Azure
- IMDS + managed identity token
- ARM enumeration
- Key Vault / Storage / VM discovery
- Azure AD Graph queries
- PIM eligible role activation
- Illicit consent (out of scope — phishing)
- 7 known Azure privesc paths
- Azure AD Connect / DCSync-style

### GCP
- IMDS + service account token
- gcloud enumeration
- IAM policy review
- 10 known GCP privesc paths
- Cross-project impersonation
- Cloud Run / Functions / Build pivots

### Serverless / Container
- Lambda env variables for secrets
- /tmp persistence (volatile)
- K8s service account token
- Container escape paths

## Chains

```
SSRF → IMDS → Role → Privesc → Data
SSRF → IMDS → Role → Cross-account → Org
Leaked key → STS → Enum → Resources
Public bucket → Config → Keys → STS
Misconfig IDP → OAuth app → Cloud API
```

## Spawns

`cloud-pivot` agent.

## MITRE ATT&CK Coverage

- T1552.005 (Cloud metadata API)
- T1078.004 (Valid cloud accounts)
- T1526 (Cloud service discovery)
- T1580 (Cloud infra discovery)
- T1530 (Data from cloud storage)

## Rules

- **Stop at enum** — list, don't read
- **No data exfil** — show access only
- **Don't modify** — no resource creation
- **Document privesc for defenders**
- **Authorized scope** — cloud ≠ free pass
