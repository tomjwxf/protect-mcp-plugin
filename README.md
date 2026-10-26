# protect-mcp for Claude

Set up local tool policies and check signed decision receipts with Claude's help.
This plugin provides four guided workflows for the open-source
[protect-mcp gateway](https://github.com/ScopeBlind/scopeblind-gateway).
**Installing the plugin does not enable enforcement or intercept tool calls.**
You choose the server, review its policy and test the configured route before
relying on it.

| Workflow | What you get |
| --- | --- |
| `/protect-mcp:shadow` | Observe calls routed through a chosen MCP server without blocking them. |
| `/protect-mcp:enforce` | Configure and test blocking rules for that route. |
| `/protect-mcp:verify` | Check receipt signatures using the public key you expect. |
| `/protect-mcp:red-team` | Run a harmless policy and receipt check in a disposable directory. |

The plugin is version **1.1.0**. Its examples use **protect-mcp 0.32.4** and
**@veritasacta/verify 0.11.1**. Plugin and npm package versions are separate.

## Install

In Claude, open the plugin directory, find **protect-mcp** by **tomjwxf**, and
install it. This repository is the source of that existing directory listing.
The directory keeps its last approved release until Anthropic publishes an
update; its displayed version may therefore lag this repository.

For a local preview in Claude Code:

```sh
git clone https://github.com/tomjwxf/protect-mcp-plugin.git
claude --plugin-dir ./protect-mcp-plugin
```

Start with `/protect-mcp:red-team` to check two proposed actions and verify the
receipts. It does not execute those actions or modify your project's hooks.
The shadow and enforce workflows then help you connect a server you select.

Running the examples requires Node.js 22 or later and npm on the machine where
the commands execute. Claude Code can use your local terminal. In other Claude
surfaces, use the instructions in your own terminal; this plugin does not give
Claude chat access to your machine or enforce policy there. Availability of a
skill in a directory is not evidence that its tools are connected.

## What changes when you install it

The plugin supplies instructions and command prompts. It contains no automatic
hooks, MCP server configuration, background service or network client. It does
not grant permissions or turn off Claude's native permission prompts. A gateway
started explicitly by you is a separate process with its own configuration.

The gateway covers only calls routed through it. Shadow mode observes calls and
allows them; enforcement must be selected explicitly. Signing requires a
configured private key. A signed decision establishes what that key signed,
not that an action executed or that every action was recorded. For someone
else's receipts, obtain the expected public key through a separate trusted
channel instead of trusting a key supplied inside the record.

For automatic Claude Code hook integration, follow the gateway's separate
[tested plugin setup](https://github.com/ScopeBlind/scopeblind-gateway/blob/main/docs/claude-plugin.md).
It requires a running local gate and has different startup and failure behavior.
Review it before switching; do not install overlapping hook integrations.

## Data handling

This plugin has no ScopeBlind account requirement and sends no telemetry itself.
Claude still processes the conversation and any tool output you choose to give
it under your Claude settings. Do not paste signing keys or private customer
records into a prompt.

The pinned `npx` commands may download packages from npm. Once installed, local
policy evaluation and the documented receipt checks run without ScopeBlind
network requests. A server you wrap can make its own requests. The gateway can
write sensitive tool arguments, results and receipts locally; choose storage
and retention appropriate to your work. Share the public key, never the signing
key file. No hosted witness or collaboration service is needed for these guides.

## Upgrading from 1.0.0

Version 1.1.0 removes the old post-tool message that said a call was wrapped when
its command text merely mentioned `protect-mcp`. That message did not establish
enforcement or receipt creation. This update adds no automatic blocking hooks.

Existing workflow names are preserved. Policy examples now use the gateway's
current schema, package commands are pinned, and verification asks for the
expected signing key. Restart the Claude session after updating to reload the
plugin. To check a real integration, inspect its configuration and test a
harmless allowed call and a denied call through the route you intend to use.

## Contribute and report problems

See [CONTRIBUTING.md](CONTRIBUTING.md) for local checks. Report documentation or
compatibility problems through this repository's
[issues](https://github.com/tomjwxf/protect-mcp-plugin/issues), including the
plugin version, host version and a minimal example with sensitive data removed.
Report security issues privately to **security@scopeblind.com**.

This plugin is [MIT licensed](LICENSE). The gateway is MIT licensed;
the separate verifier package is Apache-2.0 licensed.

- [Gateway and setup](https://scopeblind.com/protect-mcp)
- [Gateway security boundary](https://github.com/ScopeBlind/scopeblind-gateway/blob/main/SECURITY.md)
- [Receipt verification](https://github.com/ScopeBlind/scopeblind-gateway/blob/main/docs/receipts.md)
- [Changes](CHANGELOG.md)
