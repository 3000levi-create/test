---
name: hunt-api
description: >
  API-specific vulnerability hunt. GraphQL
  introspection + field suggestion, gRPC
  reflection, REST BOLA/BFLA/mass-assignment,
  WebSocket state abuse. OWASP API Top 10
  (2023) mapped to MITRE ATT&CK. Spawns
  api-auditor agent.
argument-hint: "[target.com or endpoint]"
allowed_tools:
  - Agent
  - Read
  - Glob
  - Grep
  - Bash
  - WebFetch
---

# /hunt-api — OWASP API Top 10 Hunt

APIs are NOT just REST. GraphQL has its own
attack surface. gRPC has schemas. Each needs
specialized hunting.

## Usage

```bash
claude "/hunt-api target.com"
claude "/hunt-api https://api.target.com/graphql"
```

## Coverage

- **API1: BOLA** — object-level auth
- **API2: Broken Auth** — JWT, OAuth, API keys
- **API3: BOPLA** — mass assignment, excessive
  data exposure
- **API4: Resource Consumption** — GraphQL
  query depth, batching
- **API5: BFLA** — function-level auth
- **API6: Sensitive Business Flow** — password
  reset, coupon, OTP rate limits
- **API7: SSRF** — URL fetchers
- **API8: Misconfig** — CORS, verbs, errors
- **API9: Inventory** — v1 shadow APIs, staging
- **API10: 3rd-Party Consumption** — webhooks,
  external data

## GraphQL-Specific

- Introspection leak (full schema dump)
- Field suggestion abuse (schema via errors)
- Batching / alias attacks (rate bypass)
- Mutation without auth
- Query depth DoS (defensive report)

## gRPC-Specific

- Reflection enabled
- Method enumeration
- Protobuf fuzzing
- Unauthenticated service calls

## WebSocket-Specific

- Auth on upgrade vs per-message
- Cross-origin hijacking
- Message injection

## When to Use

- `/hunt-api` = focused API hunt
- `/hunt` (master) runs this automatically
  when `surface-mapper` detects APIs

## Rules

- Confidence >= 8 or drop
- Verify BOLA with 2 accounts
- Safe payloads only
- Return JSON for orchestrator
