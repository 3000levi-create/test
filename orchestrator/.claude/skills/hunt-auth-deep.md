---
name: hunt-auth-deep
description: >
  Deep authentication/authorization hunt.
  OAuth 2.0/OIDC flow abuse, SAML XML signature
  wrapping, JWT algorithm confusion, SSO
  pivoting, MFA bypass, session fixation,
  account linking confusion. Highest-impact
  finding class in modern SaaS.
argument-hint: "[target.com]"
allowed_tools:
  - Agent
  - Read
  - Glob
  - Grep
  - Bash
  - WebFetch
---

# /hunt-auth-deep — SSO / OAuth / SAML / JWT

Authentication bugs are Critical tier. One
SAML XSW bug = full tenant takeover. One
OAuth scope flaw = every integrated service
compromised.

## Usage

```bash
claude "/hunt-auth-deep target.com"
```

## Coverage

### OAuth 2.0 / OIDC
- redirect_uri validation bypass
- state param CSRF
- Implicit flow leaks
- PKCE missing
- Scope elevation
- Code replay
- Confused deputy (cross-IdP)
- AS mixup attack
- Device code phishing (out of scope)
- JAR/JARM/PAR issues

### SAML
- XML Signature Wrapping (XSW)
- XXE in SAML response
- Signature bypass / unsigned assertion
- Replay attacks
- Comment injection in NameID

### JWT
- Algorithm confusion (RS256→HS256)
- alg=none
- Weak HMAC secret crack
- kid header injection
- jku / x5u abuse
- JWE alg substitution

### Session
- Session fixation
- No rotation on privilege change
- Concurrent session abuse
- Remember-me token weaknesses

### MFA
- Flow bypass (skip verify step)
- Response manipulation
- Enrollment race
- Backup code abuse
- OTP brute force / no rate limit
- SMS OTP replay

### Account Linking
- Email normalization confusion
- Pre-registration takeover
- Password reset token issues

### Authorization Bypass
- Method/path confusion
- Header injection (X-Forwarded-For, etc.)
- HTTP verb tampering

## Spawns

`auth-deep-auditor` agent.

## When to Use

- `/hunt-auth-deep` = focused auth hunt
- `/hunt` runs this automatically when SSO
  detected (Auth0, Okta, etc.)

## Rules

- Test only with your own accounts
- Don't disable victim MFA
- JWT crack only on test tokens
- Confidence >= 8 or drop
