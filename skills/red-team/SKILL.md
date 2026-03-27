---
name: red-team
description: Run attack suites against MCP security policies to verify they block what they should. Use when the user wants to benchmark a policy, test defenses, or validate OWASP MCP Top 10 coverage.
---

# Red Team — Policy Benchmarking

The user wants to test their protect-mcp policies against known attack patterns.

## Steps

1. Run the default attack suite against a policy:

```bash
npx @scopeblind/red-team --policy $ARGUMENTS
```

2. Run against a specific CVE policy:

```bash
npx @scopeblind/red-team --policy node_modules/protect-mcp/policies/clinejection.json
```

3. Generate a signed benchmark report:

```bash
npx @scopeblind/red-team --policy policy.json --sign --output report.json
```

## Key Points
- Deterministic attack suites — reproducible results
- Maps to OWASP MCP Top 10 categories
- Produces signed receipts for each test result
- Reports show pass/fail per policy rule
