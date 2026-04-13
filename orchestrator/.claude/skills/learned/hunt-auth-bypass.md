---
name: hunt-auth-bypass
description: >
  Learned technique for finding Authentication
  and Authorization Bypass vulnerabilities.
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
  Use when looking for auth bypass vulns.
  Trigger: "hunt for auth bypass",
  "check authentication", "find auth issues",
  "test access control", "check JWT"
---

# Hunt: Authentication & Authorization Bypass

## Success Rate
- Times used: 1
- Vulns found: 1
- Last refined: 2026-04-13
- Avg severity: Critical (CVSS 9.1)

## Technique

### Step 1: Find Auth Middleware

```bash
# Authentication middleware
grep -rn "isAuthenticated\|requireAuth\|authMiddleware\|authenticate\|passport\.\|jwt\.verify\|verifyToken" \
  --include="*.js" --include="*.ts" \
  --include="*.py" .

# Authorization checks
grep -rn "isAdmin\|hasRole\|hasPermission\|authorize\|rbac\|acl\|canAccess\|checkRole" \
  --include="*.js" --include="*.ts" \
  --include="*.py" .

# Route definitions (check which have auth)
grep -rn "router\.\(get\|post\|put\|delete\|patch\)" \
  --include="*.js" --include="*.ts" . | head -50
```

### Step 2: Find Unprotected Routes

```bash
# Compare: routes WITH auth vs WITHOUT
# Routes with middleware
grep -rn "router\..*auth.*\(req\|function\)" \
  --include="*.js" --include="*.ts" .

# All routes (look for ones missing auth)
grep -rn "app\.\(get\|post\|put\|delete\)\|router\.\(get\|post\|put\|delete\)" \
  --include="*.js" --include="*.ts" .

# Admin endpoints without admin check
grep -rn "admin\|dashboard\|manage\|internal\|debug\|config" \
  --include="*.js" --include="*.ts" \
  --include="*.py" .
```

**Vulnerable pattern:**
```javascript
// BAD — admin route without auth middleware
router.get('/api/admin/users', (req, res) => {
  User.findAll().then(users => res.json(users));
});

// Meanwhile other routes have auth:
router.get('/api/profile',
  requireAuth,  // ← this is protected
  (req, res) => { /* ... */ }
);
```

### Step 3: JWT Vulnerabilities

```bash
# JWT implementation
grep -rn "jwt\.\|jsonwebtoken\|jose\|JWT\|Bearer" \
  --include="*.js" --include="*.ts" \
  --include="*.py" .

# Weak JWT config
grep -rn "algorithm.*none\|alg.*none\|HS256\|secret\|signing.*key" \
  --include="*.js" --include="*.ts" \
  --include="*.py" --include="*.env" .

# JWT decode without verify
grep -rn "jwt\.decode\|jwt_decode\|atob.*split" \
  --include="*.js" --include="*.ts" \
  --include="*.py" .
```

**JWT attack vectors:**
```
# Algorithm confusion (none)
Header: {"alg":"none","typ":"JWT"}
→ Remove signature, server accepts

# Algorithm switch (RS256 → HS256)
Sign with public key using HS256
→ Server verifies with same public key

# Weak secret
Brute-force with common passwords
→ Tool: jwt-cracker / hashcat

# Missing expiration
No "exp" claim in payload
→ Token valid forever

# Missing audience/issuer
No "aud"/"iss" validation
→ Token from service A works on service B
```

### Step 4: Session Management

```bash
# Session configuration
grep -rn "session\.\|cookie\.\|maxAge\|expires\|httpOnly\|secure\|sameSite" \
  --include="*.js" --include="*.ts" \
  --include="*.py" .

# Session fixation indicators
grep -rn "regenerate\|destroy\|invalidate" \
  --include="*.js" --include="*.ts" \
  --include="*.py" .

# Password reset flow
grep -rn "reset.*password\|forgot.*password\|token.*reset\|reset.*token" \
  --include="*.js" --include="*.ts" \
  --include="*.py" .
```

### Step 5: Privilege Escalation

```bash
# Role assignment
grep -rn "role.*=\|isAdmin.*=\|setRole\|updateRole\|privilege" \
  --include="*.js" --include="*.ts" \
  --include="*.py" .

# User registration (can set own role?)
grep -rn "register\|signup\|createUser\|new.*User" \
  --include="*.js" --include="*.ts" \
  --include="*.py" .
```

**Vulnerable pattern:**
```javascript
// BAD — user can set their own role
app.post('/api/register', (req, res) => {
  const { username, password, role } = req.body;
  User.create({ username, password, role });
});
// Attacker sends: { "role": "admin" }
```

### Step 6: Common Auth Bypass Techniques

| Technique | Test |
|-----------|------|
| Missing auth on endpoint | Access without token |
| HTTP method switch | GET → POST or vice versa |
| Path traversal | `/api/v1/../admin/users` |
| Parameter pollution | `?role=user&role=admin` |
| Case manipulation | `/Admin` vs `/admin` |
| Add trailing slash | `/admin/` vs `/admin` |
| Mass assignment | Send extra fields on register |
| JWT algorithm none | Remove signature |
| Default credentials | admin:admin, test:test |
| Token reuse after logout | Use old token |

## Patterns That Work

| Pattern | Context | Confidence |
|---------|---------|------------|
| Missing middleware on admin routes | Express/Koa | Critical |
| `jwt.decode()` (not verify) | JWT handling | Critical |
| Mass assignment on registration | User signup | High |
| No role check after auth | Authorization | High |
| Token doesn't expire | JWT config | High |
| Password reset token reuse | Reset flow | Medium |

## False Positive Filters

- **Public endpoints by design**: health check,
  docs, login, register — no auth needed
- **API gateway handles auth**: middleware is
  at gateway level, not in app code
- **Feature flags**: route exists in code but
  disabled in production
- **Rate limiting as compensating control**:
  brute-force prevention on auth endpoints
- **MFA enabled**: even if bypass found, MFA
  adds a second layer

## Changelog
- 2026-04-13: Created with comprehensive auth
  bypass patterns. Covers missing middleware,
  JWT attacks, session management, privilege
  escalation, and mass assignment. Includes
  10 common bypass techniques.
