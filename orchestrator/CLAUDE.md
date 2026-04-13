# Bug Bounty Security Research Pipeline

## Overview

This project uses Claude Code's multi-agent architecture
for authorized security research on bug bounty programs
(HackerOne, Bugcrowd, etc).

**IMPORTANT**: This is for AUTHORIZED security testing
only. Always operate within the scope defined by the
bug bounty program.

## How to Use

### Quick Start — Full Pipeline

```bash
# Run the full recon → analysis → report pipeline
claude "run /recon on https://target.com"

# Or use specific phases:
claude "/recon target.com"
claude "/analyze target.com"  
claude "/report"
```

### Custom Agents

```bash
# Spawn specific agents:
claude "use the recon-agent to map target.com"
claude "use the code-auditor to review this source"
claude "use the vuln-analyzer for the auth module"
```

### Parallel Research (Batch)

```bash
# Launch parallel research on multiple areas:
claude "/batch audit all API endpoints for IDOR"
```

## Agent Types

| Agent | Purpose |
|-------|---------|
| recon-agent | Subdomain, endpoint, tech discovery |
| code-auditor | Source code vulnerability analysis |
| vuln-analyzer | Deep-dive on specific vuln classes |
| exploit-writer | PoC development (authorized only) |
| report-writer | HackerOne report formatting |

## Skills

| Skill | Usage |
|-------|-------|
| /recon | Full reconnaissance pipeline |
| /analyze | Vulnerability analysis |
| /report | Generate HackerOne report |
| /checklist | OWASP Top 10 checklist scan |
