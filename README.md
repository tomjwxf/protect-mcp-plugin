# protect-mcp — Claude Code Plugin

MCP security gateway for Claude Code. Per-tool policies, Ed25519-signed receipts, human approval gates.

## Install

```bash
claude /plugin install https://github.com/tomjwxf/protect-mcp-plugin
```

Or test locally:

```bash
claude --plugin-dir ./claude-plugin
```

## Skills

| Skill | Description |
|-------|-------------|
| `/protect-mcp:shadow` | Wrap any MCP server in shadow mode (log everything, block nothing) |
| `/protect-mcp:enforce` | Apply per-tool security policies |
| `/protect-mcp:verify` | Verify Ed25519-signed receipts offline |
| `/protect-mcp:red-team` | Benchmark policies against attack suites |

## Commands

| Command | Description |
|---------|-------------|
| `/protect-mcp:shadow <cmd>` | Quick-start shadow mode |
| `/protect-mcp:verify [file]` | Verify a receipt or run self-test |

## Links

- npm: https://npmjs.com/package/protect-mcp
- IETF Draft: https://datatracker.ietf.org/doc/draft-farley-acta-signed-receipts/
- Docs: https://scopeblind.com/docs/protect-mcp
- License: MIT
