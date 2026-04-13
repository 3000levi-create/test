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

### Learned: 2026-04-13 — SSRF (Server-Side Request Forgery)
- Severity: Critical (CVSS 9.1)
- Pattern: Endpoints that fetch user-supplied
  URLs without validation
- Key indicators:
  - Webhook registration endpoints
  - PDF generation from URL
  - Image proxy / avatar upload by URL
  - Import from URL features
- Key grep patterns:
  - `fetch(req.body.url)` or `axios(userUrl)`
  - `webhook|callback|notify_url|proxy`
  - `pdf|screenshot|thumbnail|avatar.*url`
- Bypass techniques: DNS rebinding, decimal IP,
  IPv6 shorthand, redirect chains
- Cloud metadata: `169.254.169.254` = jackpot
- Skill: `hunt-ssrf`

### Learned: 2026-04-13 — Insecure Deserialization
- Severity: Critical (CVSS 9.8)
- Pattern: User-controlled data passed to
  unsafe deserialization functions
- Key indicators per language:
  - Python: `pickle.loads()`, `yaml.load()`
  - Java: `ObjectInputStream`, `readObject()`
  - PHP: `unserialize()`, `__wakeup()`
  - Node.js: `node-serialize`, `js-yaml`
  - .NET: `BinaryFormatter`, `TypeNameHandling`
- Key grep patterns:
  - `pickle.loads|yaml.load|marshal.loads`
  - `ObjectInputStream|readObject|XMLDecoder`
  - `unserialize|__wakeup|__destruct`
- Network signatures: Java=`AC ED 00 05`,
  PHP=`O:4:"Class"`, Python=`80 04 95`
- Skill: `hunt-deserialization`

### Learned: 2026-04-13 — SQL Injection
- Severity: Critical (CVSS 9.8)
- Pattern: User input concatenated into SQL
  queries instead of parameterized
- Key indicators:
  - String concatenation in SQL statements
  - ORM `.raw()` methods with user input
  - Search/filter/sort endpoints
- Key grep patterns:
  - `query.*\`.*\${` (template literals)
  - `"SELECT.*" + req.query`
  - `sequelize.query|.raw(|cursor.execute`
- High-value targets: search, sort, filter,
  login, export/report endpoints
- Skill: `hunt-sqli`

### Learned: 2026-04-13 — XSS (Cross-Site Scripting)
- Severity: Medium-High (CVSS 6.1-8.0)
- Pattern: User input rendered in HTML without
  proper output encoding
- Key indicators:
  - `dangerouslySetInnerHTML` (React)
  - `v-html` (Vue), `bypassSecurityTrust` (Angular)
  - `innerHTML = userInput`
  - `<%- variable %>` (unescaped EJS)
- Types: Stored > Reflected > DOM-based
- Key grep patterns:
  - `innerHTML|outerHTML|document.write`
  - `dangerouslySetInnerHTML|v-html`
  - `eval(|setTimeout(|Function(`
- Skill: `hunt-xss`

### Learned: 2026-04-13 — Auth Bypass
- Severity: Critical (CVSS 9.1)
- Pattern: Missing or misconfigured auth
  middleware on sensitive endpoints
- Key indicators:
  - Routes without auth middleware
  - JWT decode without verify
  - Mass assignment on registration
  - Token without expiration
- Key grep patterns:
  - `jwt.decode` (not `jwt.verify`)
  - `router.get('/admin'` without middleware
  - `{ username, password, role } = req.body`
- Attack vectors: algorithm none, method switch,
  path traversal, parameter pollution
- Skill: `hunt-auth-bypass`

## High-Value Patterns

### Patterns That Pay Well
- IDOR on order/payment endpoints — High sev
- SSRF → AWS metadata credentials — Critical
- Deserialization RCE via pickle/Java — Critical
- SQLi on search/filter endpoints — Critical
- Stored XSS in admin-visible fields — High
- Auth bypass on admin routes — Critical
- JWT algorithm confusion — Critical

### Common False Positives
- Public API endpoints (no auth = not IDOR)
- UUID-based IDs (not enumerable)
- Client-side fetch() (can't reach internal)
- `yaml.safe_load()` (safe variant)
- `JSON.parse()` (no code execution)
- React `{variable}` (auto-escaped)
- Parameterized queries with `$1` / `?`
- API gateway handles auth externally

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
- Skills learned: 6
- Skill list: hunt-idor, hunt-ssrf,
  hunt-deserialization, hunt-sqli,
  hunt-xss, hunt-auth-bypass
