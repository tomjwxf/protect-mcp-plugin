---
name: shadow
description: Wrap an MCP server in shadow mode to log all tool calls without blocking. Use when the user wants to audit or observe what an MCP server is doing, see what tools agents are calling, or start monitoring before enforcing policies.
---

# Shadow Mode — Log Everything, Block Nothing

The user wants to observe MCP tool calls without interfering. Wrap their MCP server command with protect-mcp in shadow mode.

## Steps

1. Ask the user for their MCP server command (e.g., `node server.js`, `npx some-mcp-server`)
2. Run the following to start shadow mode:

```bash
npx protect-mcp -- $ARGUMENTS
```

3. Shadow mode logs every tool call with timestamps, tool names, and decision metadata
4. To generate Ed25519-signed receipts, first initialize:

```bash
npx protect-mcp init
```

Then re-run the shadow command. All decisions will now produce signed receipts.

## Key Points
- Shadow mode is the default — no policy file needed
- Zero code changes to the wrapped server
- Works with any stdio MCP server
- Receipts are independently verifiable: `npx @veritasacta/verify receipt.json`
