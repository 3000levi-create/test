---
description: >
  Full reconnaissance pipeline. Runs parallel
  agents to map the target's attack surface.
  Usage: /recon target.com
allowed_tools:
  - Agent
  - SendMessage
  - TodoWrite
  - Read
  - Bash
  - WebSearch
---

# Recon Pipeline — Parallel Attack Surface Mapping

You are orchestrating a full reconnaissance
pipeline for authorized bug bounty testing.

## User Target

The user wants to perform recon on: $ARGUMENTS

## Phase 1: Parallel Passive Recon

Launch these agents **in parallel** (single
message, multiple Agent tool calls):

### Agent 1: Subdomain & DNS Recon
```
Use the recon-agent to enumerate subdomains
and DNS records for [target].

Steps:
1. Query crt.sh certificate transparency
2. DNS records (A, AAAA, MX, TXT, NS, CNAME)
3. Reverse DNS on discovered IPs
4. Check for wildcard DNS
5. Check for zone transfer

Report all subdomains found with their IPs
and status codes.
```

### Agent 2: Technology Fingerprinting
```
Use the recon-agent to fingerprint technologies
on [target].

Steps:
1. HTTP response headers analysis
2. Check common paths (robots.txt, sitemap,
   .well-known, swagger, graphql)
3. JavaScript framework detection
4. Server and CDN identification
5. WAF detection

Report the full tech stack with evidence.
```

### Agent 3: Endpoint Discovery
```
Use the recon-agent to discover endpoints
on [target].

Steps:
1. Wayback Machine historical URLs
2. Common API path bruteforce
3. JavaScript source URL extraction
4. Look for API documentation endpoints
5. Check for GraphQL introspection

Report all discovered endpoints with
status codes and descriptions.
```

### Agent 4: OSINT Research
```
Use the recon-agent to gather OSINT on [target].

Steps:
1. Search for GitHub repos by the company
2. Look for exposed credentials in public
   sources (authorized scope only)
3. Check job postings for tech stack hints
4. Search for past security advisories
5. Check for security.txt and bug bounty scope

Report all interesting findings.
```

## Phase 2: Synthesis

After all agents complete:
1. **Combine findings** into a unified
   attack surface map
2. **Identify high-value targets** — endpoints
   with auth, file uploads, admin panels,
   API endpoints accepting user input
3. **Prioritize** by likely vulnerability
   class and bounty potential
4. **Create a testing plan** for the next phase

## Phase 3: Report

Output a structured recon report with:
- Full subdomain list
- Technology stack
- Endpoint map
- OSINT findings
- Prioritized testing targets
- Recommended next steps

Save to `reports/[target]/recon_[date].md`
