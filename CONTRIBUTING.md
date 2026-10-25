# Contributing

This repository contains the guidance plugin published as protect-mcp in
Claude's directory. The gateway implementation is maintained in
[ScopeBlind/scopeblind-gateway](https://github.com/ScopeBlind/scopeblind-gateway).

Keep examples reproducible against pinned, published packages. A plugin update
must not silently install host hooks, start a service, grant authority or claim
enforcement without a tested route. Preserve existing workflow names when an
update is compatible.

Use Node.js 22 or later. Run the repository's checks before opening a pull
request:

```sh
node --test scripts/check-plugin.test.mjs
node scripts/clean-install-smoke.mjs
```

The smoke test downloads the pinned public npm packages into a disposable
directory, then checks a synthetic MCP server, Cedar decisions and signed
receipts. It does not use your project configuration or real tool servers.
With Claude Code installed, also validate the plugin:

```sh
claude plugin validate --strict .
```

Describe the behavior changed and the checks run in the pull request. Never
include private keys, credentials, customer transcripts or private repository
links in a report or fixture. Send security reports to security@scopeblind.com.

The plugin version is separate from the gateway npm version. Maintainers update
this repository's plugin version when shipping a plugin change, validate it,
and request review on the existing directory submission. Do not create a new
submission for an ordinary update. A passing local check does not imply
Anthropic approval or publication.
