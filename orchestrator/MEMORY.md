# Bug Bounty Memory

> This file persists across sessions.
> Updated automatically by /after-hunt.

## Techniques Library

### Learned: 2026-04-13 — IDOR (Insecure Direct Object Reference)
- Target: DemoCorp
- Severity: High (CVSS 7.5)
- Pattern: Numeric sequential IDs in REST API
  without ownership validation
- Discovery method:
  1. Found `/api/v2/orders/{id}` in recon
  2. Noticed IDs are sequential integers
  3. Changed ID from 1001 → 1002
  4. Got another user's order data
- Key grep patterns:
  - `/api/.*/:id` or `/api/.*/[0-9]+`
  - `params.id` without `req.user` check
  - `findById` without `where: { userId }`
- False positives:
  - Public resources (no auth needed)
  - UUIDs (not guessable)
- Skill: `hunt-idor`

## High-Value Patterns

### Patterns That Pay Well
- IDOR on order/payment endpoints — High sev

### Common False Positives
- Public API endpoints (no auth = not IDOR)
- UUID-based IDs (not enumerable)

## Tool Shortcuts

### Fast Recon
```bash
# Quick subdomain enum
curl -s "https://crt.sh/?q=%25.TARGET&output=json" | jq -r '.[].name_value' | sort -u

# Quick tech fingerprint
curl -sI https://TARGET | grep -i "server\|x-powered\|x-frame\|content-security"

# Quick endpoint discovery
curl -s "https://web.archive.org/cdx/search/cdx?url=TARGET/*&output=json&fl=original&collapse=urlkey" | jq -r '.[][]' | sort -u | head -50
```

### Fast Code Audit
```bash
# All dangerous sinks in one command
grep -rn "exec\|eval\|system\|query\|innerHTML\|document.write\|fetch\|axios" --include="*.js" --include="*.ts" --include="*.py" .
```

## Stats

- Total hunts: 1
- Total findings: 1
- Total bounties: $0 (pending)
- Skills learned: 1
