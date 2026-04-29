---
name: hunt-xss
description: >
  Learned technique for finding XSS
  (Cross-Site Scripting) vulnerabilities.
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
  Use when looking for XSS vulnerabilities.
  Trigger: "hunt for XSS", "check for XSS",
  "find cross-site scripting", "test output
  encoding"
---

# Hunt: XSS (Cross-Site Scripting)

## Success Rate
- Times used: 1
- Vulns found: 1
- Last refined: 2026-04-13
- Avg severity: Medium-High (CVSS 6.1-8.0)

## Technique

### Step 1: Find Dangerous Sinks

```bash
# DOM-based XSS sinks (JavaScript)
grep -rn "innerHTML\|outerHTML\|document\.write\|document\.writeln\|\.insertAdjacentHTML\|\.html(" \
  --include="*.js" --include="*.ts" \
  --include="*.jsx" --include="*.tsx" .

# eval-family sinks
grep -rn "eval(\|setTimeout(\|setInterval(\|Function(\|execScript" \
  --include="*.js" --include="*.ts" .

# URL/navigation sinks
grep -rn "location\.href\|location\.assign\|location\.replace\|window\.open\|\.src\s*=" \
  --include="*.js" --include="*.ts" .

# React dangerouslySetInnerHTML
grep -rn "dangerouslySetInnerHTML\|__html" \
  --include="*.jsx" --include="*.tsx" \
  --include="*.js" --include="*.ts" .

# Vue v-html directive
grep -rn "v-html" \
  --include="*.vue" .

# Angular bypassSecurityTrust
grep -rn "bypassSecurityTrust\|DomSanitizer" \
  --include="*.ts" .

# Server-side template injection
grep -rn "render.*html\|\.render(\|template\|<%=\|{{{.*}}}" \
  --include="*.js" --include="*.ts" \
  --include="*.py" --include="*.erb" \
  --include="*.ejs" --include="*.hbs" .
```

### Step 2: Trace User Input to Sink

```bash
# URL parameters reaching DOM
grep -rn "location\.search\|location\.hash\|URLSearchParams\|\.get(\|req\.query\|req\.params" \
  --include="*.js" --include="*.ts" .

# User-generated content rendered
grep -rn "comment\|message\|bio\|description\|title\|name\|profile" \
  --include="*.jsx" --include="*.tsx" \
  --include="*.vue" --include="*.ejs" .
```

### Step 3: Check Output Encoding

```bash
# Encoding/sanitization functions
grep -rn "escapeHtml\|sanitize\|encode\|DOMPurify\|xss\|htmlspecialchars\|bleach\|strip_tags" \
  --include="*.js" --include="*.ts" \
  --include="*.py" --include="*.php" .

# CSP headers
grep -rn "Content-Security-Policy\|helmet\|csp" \
  --include="*.js" --include="*.ts" \
  --include="*.py" --include="*.conf" .
```

**Vulnerable patterns:**

```javascript
// BAD — Stored XSS (React)
function Comment({ comment }) {
  return <div dangerouslySetInnerHTML={{
    __html: comment.body
  }} />;
}

// BAD — Reflected XSS (Express + EJS)
app.get('/search', (req, res) => {
  res.render('results', {
    query: req.query.q  // unescaped in <%- %>
  });
});

// BAD — DOM XSS
const name = new URLSearchParams(
  location.search
).get('name');
document.getElementById('greeting')
  .innerHTML = 'Hello ' + name;
```

**Safe patterns:**

```javascript
// GOOD — React auto-escapes
function Comment({ comment }) {
  return <div>{comment.body}</div>;
}

// GOOD — sanitized HTML
function Comment({ comment }) {
  return <div dangerouslySetInnerHTML={{
    __html: DOMPurify.sanitize(comment.body)
  }} />;
}

// GOOD — textContent instead of innerHTML
document.getElementById('greeting')
  .textContent = 'Hello ' + name;
```

### Step 4: XSS Types & Context

| Type | Vector | Persistence |
|------|--------|-------------|
| Reflected | URL params → page | None |
| Stored | DB → page | Permanent |
| DOM-based | URL → JS sink | None |
| Mutation | HTML rewriting | Varies |

**Context-dependent payloads:**

| Context | Payload Example |
|---------|----------------|
| HTML body | `<img onerror=alert(1) src=x>` |
| HTML attribute | `" onfocus=alert(1) autofocus="` |
| JavaScript | `';alert(1)//` |
| URL | `javascript:alert(1)` |
| CSS | `expression(alert(1))` |

### Step 5: Assess Severity

| Scenario | CVSS | Severity |
|----------|------|----------|
| Stored XSS + admin panel | 8.0 | High |
| Stored XSS + account takeover | 8.0 | High |
| Reflected XSS + auth token | 6.1 | Medium |
| Self-XSS only | 3.5 | Low |
| DOM XSS with CSP bypass | 7.1 | High |

## Patterns That Work

| Pattern | Framework | Confidence |
|---------|-----------|------------|
| `dangerouslySetInnerHTML` + user data | React | High |
| `v-html` + user data | Vue | High |
| `<%- variable %>` (unescaped EJS) | Express | High |
| `innerHTML = userInput` | Vanilla JS | Critical |
| `{{{ variable }}}` (triple Handlebars) | Handlebars | High |
| `| safe` filter in Jinja2 | Flask | High |

## False Positive Filters

- **React JSX `{variable}`**: auto-escaped,
  not vulnerable
- **`<%= variable %>`** (EJS): auto-escaped
  (only `<%-` is dangerous)
- **`{{ variable }}`** (Handlebars double):
  auto-escaped
- **Static content only**: no user input
  reaches the sink
- **Strong CSP**: `script-src 'self'` blocks
  inline script execution
- **HttpOnly cookies**: XSS can't steal session
  (but can still do actions)

## Changelog
- 2026-04-13: Created with patterns for React,
  Vue, Angular, Express/EJS, Handlebars, vanilla
  JS. Covers Stored, Reflected, and DOM XSS.
  Includes context-dependent payload guide.
