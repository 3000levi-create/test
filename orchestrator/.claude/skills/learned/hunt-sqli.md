---
name: hunt-sqli
description: >
  Learned technique for finding SQL Injection
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
  Use when looking for SQL injection vulns.
  Trigger: "hunt for SQLi", "check for SQL
  injection", "find injection", "test queries"
---

# Hunt: SQL Injection

## Success Rate
- Times used: 1
- Vulns found: 1
- Last refined: 2026-04-13
- Avg severity: Critical (CVSS 9.8)

## Technique

### Step 1: Find Raw SQL Queries

```bash
# String concatenation in SQL (most dangerous)
grep -rn "SELECT.*+.*req\.\|INSERT.*+.*req\.\|UPDATE.*+.*req\.\|DELETE.*+.*req\." \
  --include="*.js" --include="*.ts" \
  --include="*.py" --include="*.php" \
  --include="*.java" .

# Template literals in SQL
grep -rn 'query.*`.*\$\{' \
  --include="*.js" --include="*.ts" .

# Python f-strings / format in SQL
grep -rn 'execute.*f"\|execute.*\.format\|execute.*%s.*%' \
  --include="*.py" .

# PHP string interpolation in SQL
grep -rn 'query.*\$_\(GET\|POST\|REQUEST\|COOKIE\)' \
  --include="*.php" .

# Java string concat in SQL
grep -rn 'Statement.*execute.*+\|prepareStatement.*+' \
  --include="*.java" .

# Raw query methods
grep -rn "raw\|rawQuery\|execute\|query(" \
  --include="*.js" --include="*.ts" \
  --include="*.py" --include="*.java" .
```

### Step 2: Check for ORM Misuse

```bash
# Sequelize raw queries
grep -rn "sequelize\.query\|\.literal\|Sequelize\.literal" \
  --include="*.js" --include="*.ts" .

# Django raw SQL
grep -rn "\.raw(\|\.extra(\|RawSQL\|cursor\.execute" \
  --include="*.py" .

# SQLAlchemy text()
grep -rn "text(\|from_statement\|execute(" \
  --include="*.py" .

# ActiveRecord raw
grep -rn "find_by_sql\|where.*#{.*}\|execute\b" \
  --include="*.rb" .

# TypeORM raw
grep -rn "createQueryBuilder\|\.query(\|\.raw(" \
  --include="*.ts" --include="*.js" .
```

### Step 3: Trace User Input to Query

For each candidate, verify the data path:

```bash
# Does user input reach the query?
# Trace: req.params/req.body/req.query → variable → SQL

# Search/filter endpoints (common SQLi targets)
grep -rn "search\|filter\|sort\|order.*by\|group.*by\|limit\|offset" \
  --include="*.js" --include="*.ts" \
  --include="*.py" .
```

**Vulnerable pattern:**
```javascript
// BAD — string concatenation
app.get('/api/users', (req, res) => {
  const sort = req.query.sort;
  db.query(
    `SELECT * FROM users ORDER BY ${sort}`
  );
});
```

**Safe pattern:**
```javascript
// GOOD — parameterized query
app.get('/api/users', (req, res) => {
  const allowed = ['name', 'email', 'created'];
  const sort = allowed.includes(req.query.sort)
    ? req.query.sort : 'created';
  db.query(
    'SELECT * FROM users ORDER BY $1',
    [sort]
  );
});
```

### Step 4: Identify SQLi Type

| Type | Test | Indicator |
|------|------|-----------|
| Error-based | `' OR 1=1--` | SQL error msg |
| Union-based | `' UNION SELECT 1,2,3--` | Extra columns |
| Blind boolean | `' AND 1=1--` vs `' AND 1=2--` | Different responses |
| Blind time | `'; WAITFOR DELAY '0:0:5'--` | Response delay |
| Second-order | Stored input used later | Delayed execution |

### Step 5: High-Value SQLi Targets

These endpoints are most likely to have SQLi:
- **Search**: `?q=` or `?search=`
- **Sort/Order**: `?sort=name&order=asc`
- **Filter**: `?category=` or `?status=`
- **Login**: username/password fields
- **Export/Report**: dynamic report builders
- **API with complex queries**: multi-filter

## Patterns That Work

| Pattern | Context | Confidence |
|---------|---------|------------|
| `query(\`...${userInput}\`)` | Template literal | Critical |
| `"SELECT..." + req.query.x` | String concat | Critical |
| `.raw()` with user input | ORM bypass | High |
| ORDER BY user-controlled column | Sort feature | High |
| LIKE '%user_input%' | Search feature | Medium |

## False Positive Filters

- **Parameterized queries**: `$1`, `?`, `:name`
  placeholders are safe
- **ORM methods**: `.findAll({ where })` with
  object syntax is safe
- **Allowlisted values**: input checked against
  known-good list before SQL
- **Integer casting**: `parseInt()` before use
  in query prevents string injection
- **Stored procedures**: with typed parameters
  are generally safe

## Changelog
- 2026-04-13: Created with patterns for Node.js,
  Python, PHP, Java, Ruby. Covers raw SQL, ORM
  misuse, and ORDER BY injection. Includes
  SQLi type identification guide.
