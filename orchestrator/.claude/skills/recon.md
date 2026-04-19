---
description: >
  Full reconnaissance pipeline. Runs 4 parallel
  recon-agents to map the target's attack
  surface. READ-ONLY. Feeds /security-review
  and /verify in the next stage.
allowed_tools:
  - Agent
  - SendMessage
  - TodoWrite
  - Read
  - Bash
  - WebSearch
when_to_use: >
  First step of any new bug bounty hunt.
  Triggers: "/recon", "map attack surface",
  "recon target.com"
argument-hint: "[target domain or URL]"
---

# Recon Pipeline — Parallel Attack Surface Map

Orchestrate a full reconnaissance pipeline for
authorized bug bounty testing. **Read-only.**

## Target

$ARGUMENTS

If not provided, ask for target + scope.

## Pre-Flight

1. Read TARGETS.md — have we hunted this
   target before? Load prior notes.
2. Read MEMORY.md — any applicable techniques?
3. Check authorized scope — abort if unclear.

## Phase 1: Parallel Passive Recon

Launch these 4 agents **in parallel** (single
message, 4 Agent tool calls). All use the
`recon-agent` type.

### Agent 1: Subdomain & DNS
```
Use the recon-agent to enumerate subdomains
and DNS for [target].

Steps:
1. crt.sh certificate transparency
2. DNS records (A, AAAA, MX, TXT, NS, CNAME)
3. Reverse DNS on discovered IPs
4. Wildcard DNS check
5. Zone transfer attempt (passive)

Report: subdomains + IPs + status codes.
```

### Agent 2: Technology Fingerprinting
```
Use the recon-agent to fingerprint tech
on [target].

Steps:
1. HTTP header analysis
2. Common paths (robots, sitemap, .well-known,
   swagger, graphql, .git)
3. JS framework detection
4. Server + CDN identification
5. WAF detection

Report: full stack with evidence.
```

### Agent 3: Endpoint Discovery
```
Use the recon-agent to discover endpoints
on [target].

Steps:
1. Wayback Machine historical URLs
2. Common API paths
3. JS source URL extraction
4. API docs endpoints
5. GraphQL introspection

Report: endpoints + status + notes.
```

### Agent 4: OSINT
```
Use the recon-agent to gather OSINT
on [target].

Steps:
1. GitHub repos by the company
2. Public paste sites for leaks (scope-aware)
3. Job postings for stack hints
4. Past security advisories
5. security.txt + bounty scope

Report: all interesting findings.
```

## Phase 2: Synthesis

After all 4 agents return:
1. **Combine findings** into unified map
2. **Identify high-value targets**:
   - Auth endpoints
   - File uploads
   - Admin panels
   - API endpoints accepting user input
   - Webhooks / URL fetchers (SSRF)
   - GraphQL endpoints
3. **Prioritize** by likely vuln class +
   bounty potential (use hunt-*.md skills)
4. **Cross-reference learned skills**:
   - Does hunt-idor apply?
   - Does hunt-ssrf apply?
   - Any target-specific skill from TARGETS.md?

## Phase 3: Recon Report

```markdown
# Recon Report: [target]
# Date: [YYYY-MM-DD]

## Attack Surface Summary
- Subdomains: N
- Live endpoints: N
- Technologies: [list]
- Interesting findings: N

## Subdomains
[table]

## Endpoints
[table]

## Technologies Detected
[table]

## Interesting Findings
[table]

## High-Value Targets (prioritized)
1. [area] — apply hunt-[type] — est. $X,XXX
2. [area] — apply hunt-[type] — est. $X,XXX
3. [area] — apply hunt-[type] — est. $X,XXX

## Applicable Learned Skills
- hunt-[X] — because [evidence]
- hunt-[Y] — because [evidence]

## Recommended Next Steps
1. /security-review [highest-value path]
2. /checklist [target] (parallel OWASP)
3. /plan-hunt [target] (if complex)
```

Save to: `reports/[target]/recon_[date].md`

Also update TARGETS.md with:
- New subdomains
- Tech stack
- Session row
- Applicable skills

## Next Pipeline Step

After `/recon`:
→ `/security-review [path]` for source review
→ `/checklist [target]` for OWASP scan
→ `/plan-hunt [target]` for strategy
→ Never skip to `/report` without `/verify`
