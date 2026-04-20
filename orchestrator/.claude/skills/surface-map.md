---
name: surface-map
description: >
  Advanced external attack surface mapping.
  Upgraded from /recon — adds GitHub dorking,
  S3 bucket enum, mobile backend extraction,
  subdomain takeover detection, API spec
  discovery, CDN/WAF fingerprinting. Spawns
  surface-mapper agent.
argument-hint: "[target.com]"
allowed_tools:
  - Agent
  - Read
  - Glob
  - Grep
  - Bash
---

# /surface-map — Full External Recon

Deeper than /recon. Maps where findings
hide: forgotten subdomains, leaked secrets,
exposed buckets, mobile backends, dangling
CNAMEs, API specs.

## Usage

```bash
claude "/surface-map target.com"
```

## Pipeline

Spawns `surface-mapper` agent which covers
8 layers:

1. **Asset Discovery** — subdomains, DNS,
   ASN, cert transparency
2. **Endpoint Discovery** — archive.org,
   wayback, JS mining, API specs
3. **Source Code Leaks** — GitHub dorks,
   exposed .git, .env files
4. **Cloud Storage** — S3 / Azure blob /
   GCS bucket enum
5. **Mobile Backends** — APK/IPA decomp
   for API base URLs + keys
6. **Tech Fingerprinting** — stack, WAF,
   CDN, bot detection
7. **Subdomain Takeover** — dangling
   CNAMEs (claimable)
8. **Third-Party Integrations** — SaaS
   ecosystem map

## Output

Returns structured JSON with:
- subdomains, endpoints, APIs
- GitHub leaks + exposed buckets
- Subdomain takeover candidates
- WAF / CDN / bot detection fingerprints
- Hints for next phase (which auditors
  to prioritize)

## Why Upgrade from /recon

- `/recon` does basic subdomain + endpoint enum
- `/surface-map` adds the high-value layers:
  GitHub leaks, S3, mobile, takeovers
- These layers often contain 80% of the
  high-severity bugs

## Rules

- Passive sources first
- Respect rate limits
- Return JSON for orchestrator consumption
- Authorized scope only
