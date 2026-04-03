---
name: verify
description: Verify Ed25519-signed decision receipts offline. Use when the user wants to check receipt integrity, validate signatures, or run verification self-tests.
---

# Verify Receipts — Offline, No Account Needed

The user wants to verify decision receipts. The verifier is Apache-2.0 licensed and operates without contacting any server.

## Steps

1. To verify a specific receipt:

```bash
npx @veritasacta/verify $ARGUMENTS
```

2. To run the built-in self-test (verifies the toolchain works):

```bash
npx @veritasacta/verify --self-test
```

3. To verify all receipts in a directory:

```bash
npx @veritasacta/verify ./receipts/
```

## Key Points
- The verifier doesn't know ScopeBlind exists — pure Ed25519 math
- Works offline — no API calls, no accounts, no callbacks
- Verifies receipt structure, signature, and content hash
- Apache-2.0 licensed — use it anywhere, patent grant included
- IETF Internet-Draft: https://datatracker.ietf.org/doc/draft-farley-acta-signed-receipts/
