# Target Profiles

> Persistent target knowledge base.
> Updated by /memory and /after-hunt.

## Active Programs

---

## DemoCorp

### Program Info
- Platform: HackerOne
- Program URL: hackerone.com/democorp
- Scope: *.democorp.com
- Out of scope: blog.democorp.com
- Bounty range: $150 - $10,000
- Response time: ~3 days

### Attack Surface
- Subdomains: api.democorp.com,
  app.democorp.com, admin.democorp.com
- Tech stack: Node.js, Express, PostgreSQL,
  React, AWS S3
- Key endpoints: /api/v2/users,
  /api/v2/orders, /api/v2/files/upload
- Auth type: JWT (Bearer token)
- API format: REST

### Findings
| Date | Type | Severity | Status | Bounty |
|------|------|----------|--------|--------|
| 2026-04-13 | IDOR | High | Reported | pending |

### Tested Areas
- [ ] Authentication flows
- [x] API endpoints — IDOR found!
- [ ] File upload
- [ ] Payment processing
- [ ] Admin panel
- [ ] GraphQL
- [ ] WebSocket
- [ ] Mobile API

### Notes for Next Session
- ~~/api/v2/orders uses numeric IDs~~ FOUND!
- JWT has no expiry check — test token reuse
- File upload accepts .svg — possible XSS

### Sessions
| Date | Focus | Result |
|------|-------|--------|
| 2026-04-13 | Initial recon | Mapped surface |

<!--
Template for new targets:

## [Target Name]

### Program Info
- Platform: HackerOne / Bugcrowd
- Program URL:
- Scope:
- Out of scope:
- Bounty range:
- Response time:

### Attack Surface
- Subdomains:
- Tech stack:
- Key endpoints:
- Auth type:
- API format: REST / GraphQL / gRPC

### Findings
| Date | Type | Severity | Status | Bounty |
|------|------|----------|--------|--------|

### Tested Areas
- [ ] Authentication flows
- [ ] API endpoints
- [ ] File upload
- [ ] Payment processing
- [ ] Admin panel
- [ ] GraphQL
- [ ] WebSocket
- [ ] Mobile API

### Notes for Next Session
-

### Sessions
| Date | Focus | Result |
|------|-------|--------|
-->
