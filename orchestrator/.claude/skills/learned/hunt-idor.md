---
name: hunt-idor
description: >
  Learned technique for finding IDOR
  (Insecure Direct Object Reference)
  vulnerabilities. Refined 1 time.
  Last success: 2026-04-13.
allowed_tools:
  - Agent
  - Read
  - Grep
  - Glob
  - Bash
  - WebFetch
  - WebSearch
when_to_use: >
  Use when looking for IDOR vulnerabilities.
  Trigger: "hunt for IDOR", "check for IDOR",
  "find access control issues",
  "test authorization"
---

# Hunt: IDOR (Insecure Direct Object Reference)

## Success Rate
- Times used: 1
- Vulns found: 1
- Last refined: 2026-04-13
- Avg severity: High (CVSS 7.5)

## Technique

### Step 1: Find Candidate Endpoints

Look for API endpoints with resource IDs:

```bash
# Search for numeric ID patterns in URLs
grep -rn "/api/.*/:id\|/api/.*/[0-9]" \
  --include="*.js" --include="*.ts" \
  --include="*.py" --include="*.rb" .

# Search for route definitions
grep -rn "router\.\(get\|post\|put\|delete\)" \
  --include="*.js" --include="*.ts" .

# Find parameterized routes
grep -rn "params\.id\|params\[.id.\]" \
  --include="*.js" --include="*.ts" .
```

**Indicators of IDOR-prone endpoints:**
- Sequential numeric IDs (1, 2, 3...)
- Endpoints like /users/{id}, /orders/{id}
- Resource access without ownership check
- No middleware for authorization

### Step 2: Check Authorization Logic

For each candidate endpoint, verify:

```bash
# Does the handler check the requesting user?
grep -A 20 "params.id" routes/*.js | \
  grep -c "req.user\|currentUser\|session.user"

# Look for findById WITHOUT user filter
grep -rn "findById\|findOne.*id" \
  --include="*.js" --include="*.ts" . | \
  grep -v "userId\|user_id\|owner"
```

**Vulnerable pattern:**
```javascript
// BAD — no ownership check
app.get('/api/orders/:id', (req, res) => {
  Order.findById(req.params.id)
    .then(order => res.json(order));
});
```

**Safe pattern:**
```javascript
// GOOD — checks ownership
app.get('/api/orders/:id', (req, res) => {
  Order.findOne({
    id: req.params.id,
    userId: req.user.id  // ownership check
  }).then(order => res.json(order));
});
```

### Step 3: Test the Vulnerability

1. Login as User A
2. Access /api/orders/1001 (your order)
3. Note the response
4. Access /api/orders/1002 (not your order)
5. If you get data → IDOR confirmed

### Step 4: Assess Impact

Check what data is exposed:
- PII (names, emails, addresses)?
- Financial data (payment info, amounts)?
- Can you modify/delete other users' data?
- Can you escalate to admin resources?

## Patterns That Work

| Pattern | Where Found | Confidence |
|---------|-------------|------------|
| `findById(params.id)` without user check | DemoCorp /api/v2/orders | Confirmed |
| Sequential numeric IDs in REST routes | DemoCorp API | High |
| Missing middleware on resource routes | Express apps | Medium |

## False Positive Filters

Skip these — they look like IDOR but aren't:
- **Public resources**: endpoints that don't
  require authentication at all
- **UUID-based IDs**: not enumerable, so not
  practically exploitable via IDOR
- **Cached/static content**: same response
  regardless of user context
- **Rate-limited endpoints**: may have other
  compensating controls

## Changelog
- 2026-04-13: Created from DemoCorp hunt.
  Found IDOR on /api/v2/orders/{id}.
  Sequential IDs, no ownership validation.
