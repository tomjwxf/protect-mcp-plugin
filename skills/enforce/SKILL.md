---
name: enforce
description: Wrap an MCP server with per-tool security policies. Use when the user wants to block dangerous tools, rate-limit expensive ones, or require human approval for sensitive operations.
---

# Enforce Mode — Apply Per-Tool Policies

The user wants to apply security policies to an MCP server. Create a policy file and wrap the server.

## Steps

1. Ask the user which tools should be blocked, rate-limited, or require approval
2. Create a policy JSON file:

```json
{
  "tools": {
    "dangerous_tool": { "decision": "deny" },
    "expensive_tool": { "decision": "allow", "rateLimit": { "maxCalls": 10, "windowSecs": 60 } },
    "sensitive_tool": { "decision": "require_approval" },
    "*": { "decision": "allow" }
  }
}
```

3. Write the policy to a file (e.g., `policy.json`)
4. Run protect-mcp in enforce mode:

```bash
npx protect-mcp --policy policy.json --enforce -- $ARGUMENTS
```

## Pre-built Policy Packs

protect-mcp ships CVE-anchored policies:

```bash
# Clinejection prevention (CVE-2025-6514)
npx protect-mcp --policy clinejection --enforce -- node server.js

# MCP OAuth proxy hijack prevention
npx protect-mcp --policy mcp-oauth-proxy --enforce -- node server.js
```

## Key Points
- Policies are JSON — easy to version control and review
- Blocked calls return structured errors to the LLM client
- Rate limits use sliding windows
- Every decision is logged and optionally signed
