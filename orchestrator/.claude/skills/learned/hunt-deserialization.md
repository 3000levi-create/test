---
name: hunt-deserialization
description: >
  Learned technique for finding Insecure
  Deserialization vulnerabilities.
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
  Use when looking for deserialization vulns.
  Trigger: "hunt for deserialization",
  "check for deserialization",
  "find object injection", "test serialization"
---

# Hunt: Insecure Deserialization

## Success Rate
- Times used: 1
- Vulns found: 1
- Last refined: 2026-04-13
- Avg severity: Critical (CVSS 9.8)

## Technique

### Step 1: Identify Serialization Points

```bash
# Python pickle/yaml
grep -rn "pickle\.loads\|pickle\.load\|yaml\.load\|yaml\.unsafe_load\|marshal\.loads\|shelve\.open" \
  --include="*.py" .

# Java deserialization
grep -rn "ObjectInputStream\|readObject\|readUnshared\|XMLDecoder\|XStream\|fromXML\|Serializable" \
  --include="*.java" .

# PHP unserialize
grep -rn "unserialize\|__wakeup\|__destruct\|__toString" \
  --include="*.php" .

# Node.js/JavaScript
grep -rn "node-serialize\|serialize\|unserialize\|js-yaml\|yaml\.load\|eval.*JSON\|cryo\|funcster" \
  --include="*.js" --include="*.ts" .

# Ruby
grep -rn "Marshal\.load\|YAML\.load\|JSON\.parse.*create_additions" \
  --include="*.rb" .

# .NET
grep -rn "BinaryFormatter\|ObjectStateFormatter\|SoapFormatter\|NetDataContractSerializer\|LosFormatter\|TypeNameHandling" \
  --include="*.cs" .
```

### Step 2: Find User-Controlled Input

Check if serialized data comes from the user:

```bash
# Cookies with serialized data
grep -rn "cookie.*serial\|cookie.*marshal\|cookie.*pickle\|session.*deserial" \
  --include="*.py" --include="*.java" \
  --include="*.js" --include="*.php" .

# Request body deserialization
grep -rn "req\.body.*deserial\|request\.data.*load\|request\.get.*serial" \
  --include="*.py" --include="*.java" \
  --include="*.js" --include="*.php" .

# Base64-encoded objects in parameters
grep -rn "base64.*deserial\|decode.*serial\|b64decode.*load" \
  --include="*.py" --include="*.java" \
  --include="*.js" --include="*.php" .

# ViewState (.NET)
grep -rn "ViewState\|__VIEWSTATE\|__EVENTVALIDATION" \
  --include="*.aspx" --include="*.cs" .
```

**Vulnerable pattern (Python):**
```python
# BAD — deserializes user input
@app.route('/api/import', methods=['POST'])
def import_data():
    data = pickle.loads(
        base64.b64decode(request.data)
    )
    return jsonify(data)
```

**Safe pattern:**
```python
# GOOD — uses JSON, not pickle
@app.route('/api/import', methods=['POST'])
def import_data():
    data = json.loads(request.data)
    schema.validate(data)
    return jsonify(data)
```

### Step 3: Check for Gadget Chains

**Java:**
```bash
# Known dangerous libraries
grep -rn "commons-collections\|commons-beanutils\|spring-core\|groovy" \
  pom.xml build.gradle requirements.txt

# ysoserial gadget indicators
grep -rn "InvokerTransformer\|InstantiateTransformer\|ChainedTransformer\|ConstantTransformer" \
  --include="*.java" .
```

**Python:**
```bash
# Classes with __reduce__ (pickle gadgets)
grep -rn "__reduce__\|__reduce_ex__\|subprocess\|os\.system\|os\.popen" \
  --include="*.py" .
```

**PHP:**
```bash
# Magic methods as gadget entry points
grep -rn "__wakeup\|__destruct\|__toString\|__call\b" \
  --include="*.php" .
```

### Step 4: Detect in Network Traffic

Look for serialization signatures:

```
# Java serialized object
Hex: AC ED 00 05
Base64: rO0AB...

# .NET ViewState
Base64 blob in __VIEWSTATE param

# PHP serialized
O:4:"User":2:{s:4:"name"...

# Python pickle
Hex: 80 04 95 (protocol 4)
```

### Step 5: Assess Impact

| Scenario | Impact | CVSS |
|----------|--------|------|
| RCE via gadget chain | Full system | 9.8 |
| Object injection → auth bypass | Auth | 8.5 |
| DoS via resource bomb | Availability | 7.5 |
| Data tampering | Integrity | 6.5 |

## Patterns That Work

| Pattern | Language | Confidence |
|---------|----------|------------|
| `pickle.loads(user_input)` | Python | Critical |
| `ObjectInputStream` + user data | Java | Critical |
| `unserialize($_COOKIE[])` | PHP | Critical |
| `node-serialize` + `eval` | Node.js | Critical |
| `YAML.load(user_input)` | Ruby/Python | High |
| `BinaryFormatter.Deserialize` | .NET | Critical |
| `TypeNameHandling.All` | .NET JSON | High |

## False Positive Filters

- **Internal-only deserialization**: data never
  comes from user input (e.g., cache → cache)
- **JSON.parse()**: standard JSON parsing is
  safe (no code execution)
- **yaml.safe_load()**: safe variant in Python
- **Signed/encrypted cookies**: HMAC-verified
  serialized data (can't tamper)
- **Allowlisted classes**: Java with
  ObjectInputFilter restricting types

## Changelog
- 2026-04-13: Created with patterns for Python,
  Java, PHP, Node.js, Ruby, .NET. Includes
  gadget chain detection and network signatures.
