---
name: hunt-evasion
description: >
  WAF / bot detection / rate-limit evasion
  for PoC work. Transforms blocked payloads
  into variants that bypass Cloudflare, AWS
  WAF, Akamai, Imperva, PerimeterX, DataDome.
  Unicode, comment injection, chunked encoding,
  HTTP/2 smuggling, parameter pollution.
argument-hint: "[finding_id or description]"
allowed_tools:
  - Agent
  - Read
  - Glob
  - Grep
  - Bash
  - WebFetch
---

# /hunt-evasion — WAF / Bot / Rate-Limit Bypass

You found a bug. WAF blocks the PoC. This
skill finds the mutation that lands so the
report has a working demo.

## Usage

```bash
claude "/hunt-evasion API-001"
# Or describe manually:
claude "/hunt-evasion 'SQLi at /api/search
  blocked by Cloudflare'"
```

## Technique Library

### Universal Bypasses
- Case mutation
- URL encoding (single / double)
- Unicode encoding
- HTML entities
- Hex / base64
- Comment injection (SQL)
- Whitespace alternatives
- HTTP method variations
- Parameter pollution (HPP)
- Chunked transfer encoding
- HTTP/2 smuggling (H2.CL, H2.TE)
- JSON / XML format tricks
- Request line mutations

### WAF-Specific
- **Cloudflare** — null bytes, long URLs,
  unicode homoglyphs, DNS rebind
- **AWS WAF** — size limits, regex evasion,
  header-body desync
- **Akamai** — _abck cookie, mobile UA
- **Imperva** — encoding, HTTP/2 smuggling
- **PerimeterX / DataDome** — JS execution
  required, curl-impersonate for TLS

### Rate-Limit Bypass
- IP rotation (X-Forwarded-For)
- Session rotation
- Endpoint case variations
- Slow-drip timing
- GraphQL batching multiplier

### Bot Detection
- TLS/JA3 fingerprint (curl-impersonate)
- Browser-matching headers
- Headless hardening (stealth plugin)
- Humanized timing

## Input → Output

**Input:** blocked payload + WAF type

**Output:**
- Working mutated payload
- Mutation chain explained
- Reproducibility rate (X/Y attempts)
- Client requirements (curl vs browser)

## Spawns

`evasion-operator` agent.

## When to Use

- After a finding is blocked during
  verification
- Before writing report — ensure PoC works
- Run automatically in `/hunt` pipeline if
  surface-mapper detected WAF

## Rules

- Evasion is for PoC only — don't mass-abuse
  production
- Document mutation chain in report
- If no bypass found, say so — don't invent
