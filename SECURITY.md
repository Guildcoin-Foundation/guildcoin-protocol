# Security & threat model — proposed, not implemented

**No live endpoint, token issuer, financial system or security certification exists.**

| Threat | Required control / unresolved risk |
| --- | --- |
| Merchant charges player without consent | Wallet-hosted explicit player authorisation; merchant credential alone cannot spend |
| Compromised game client | Never embed privileged credentials or trust client-reported completion |
| Replay or duplicate POST | Merchant-scoped idempotency; immutable order reference; atomic single spend |
| Webhook forgery | Raw-body HMAC authentication, timestamp window, secret rotation, event-ID deduplication |
| Webhook lost/delayed/out-of-order | Fetch authoritative resource and reconcile transactions; fulfil once |
| Redirect manipulation | Exact-match pre-registered HTTPS redirect URIs; no arbitrary redirects |
| Cross-tenant disclosure | Scope tokens and object ownership checks; return not-found for unauthorised resources |
| Double spend / negative balance | Atomic ledger and reservations under concurrency with independent invariant tests |
| Refund farming and chargeback | Strict refund limits, same-checkout ownership, reversible accounting and funded-liability risk controls |
| Insolvency or missing backing assets | Independent financial reporting, reserve/liability reconciliation and regulation; not solved by API alone |
| Fake transparency | Independent oversight and complete supply commitments; Merkle inclusion alone cannot prove reserve adequacy |
| Platform policy violations | Restrict pilot to distribution channels after platform-policy review |
| Sensitive personal data | No balance or player PII in merchant responses/events; document retention and data access before launch |

## Verification

- Machine credentials: prefer short-lived, audience- and scope-restricted OAuth
  access tokens with secure rotation; adhere to current OAuth Security BCP.
- Webhook HMAC recipe: `HMAC_SHA256(key, ASCII(timestamp) + '.' + raw_request_body)`;
  use **exact raw bytes**, not reserialized JSON. Signature value lowercase hex.
- Reject timestamps more than 300 seconds from the verifier clock (design
  target), use constant-time digest comparison, retain event dedupe identifiers.
- Require HTTPS and safe redirect origins; webhooks should not follow redirects.
- Rate-limit write operations per merchant and protect audit logs from tampering.
- Public SDKs must distinguish error/retry cases; they never log access tokens,
  webhook secrets or sensitive transaction metadata.

## Before any test with real money

Independent threat modelling, penetration testing, regulatory analysis,
wallet risk assessment, proof of reserves/liabilities, payout enforcement,
identity and user-age safeguards, data protection, incident handling and
reconciliation testing are prerequisites. Do **not** infer financial safety or
operator credibility merely from publication of this document.
