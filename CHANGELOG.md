# Changelog

## Unreleased

- Pin the gateway and verifier examples, the static checks and the clean-install
  smoke test to protect-mcp 0.32.4 and @veritasacta/verify 0.11.1.

## 1.1.0

- Remove the post-tool message that inferred protection from a command's text.
- Keep setup explicit; introduce no automatic hooks or permission overrides.
- Pin gateway and verifier examples to tested published package versions.
- Correct policy fields and require an expected public key for verification.
- Replace the unvalidated attack-suite instructions with a harmless local check.
- Explain installation, supported execution environments, data handling and
  the distinction between this guide plugin and a running policy gateway.
- Correct public repository and homepage metadata; include the MIT license.

## 1.0.0

Initial plugin with shadow, enforce, verify and red-team workflows.
