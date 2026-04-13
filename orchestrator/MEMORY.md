# Bug Bounty Memory

> This file persists across sessions.
> Updated automatically by /after-hunt.

## Techniques Library

_No techniques learned yet. Run /after-hunt
after your first successful find._

## High-Value Patterns

### Patterns That Pay Well
_Updated as you earn bounties._

### Common False Positives
_Updated as you filter noise._

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

- Total hunts: 0
- Total findings: 0
- Total bounties: $0
- Skills learned: 0
