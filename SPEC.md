# GCIP-0001 — Merchant Checkout Interface

**Status:** discussion draft | **Version:** 0.1.0 | **Date:** 2026-10-10

This document is normative **within the proposal**, not a claim of existing
conformance. The terms MUST, MUST NOT, SHOULD and MAY express design targets.
Interfaces, amounts, error cases and lifecycle decisions may change after review.

## Problem statement

A game should be able to accept portable GC without controlling the player's
wallet, running payment infrastructure, or imposing its own currency on other
studios. An operator needs a repeatable, auditable way to transform a player's
explicitly approved spend into an eligible developer receivable. A transparent
merchant contract alone does **not** establish whether that receivable can be
redeemed for fiat or whether GC is fully reserved.

## Actors and trust boundaries

- **Player:** holder of a wallet with an operator-managed GC balance; consent
  occurs in the wallet, not via the developer backend.
- **Merchant:** an approved game/studio, represented by a scoped API credential.
  Its game server can price virtual goods and verify completed purchases.
- **Network operator:** a proposed steward maintaining wallets, ledger,
  security review and merchant records. The operator is a trusted party in v0.1.
- **External payment / platform providers:** separate legal and commercial
  systems, not exposed as part of this developer protocol.

The protocol does not disclose another game's sales, a player's balance or
identity to developers. A merchant MUST NOT be able to create or mint currency,
change another merchant's payments, or debit wallets without player approval.

## Units and representations

- `currency` is the literal string `GC`.
- Amounts use **integer minor units**, represented as base-10 strings matching
  `^[1-9][0-9]*$` for strictly positive amounts; **100 minor units = 1 GC** in
  this draft. For example `"1250"` means 12.50 GC, **not** any amount of fiat.
- Integers use decimal strings to prevent JavaScript floating point rounding.
  Implementations MUST cap accepted size and validate arithmetic in checked
  integer or decimal types; the proposed cap is `2^63 - 1` minor units.
- RFC 3339 UTC timestamps, opaque IDs, and non-sensitive merchant order IDs.
- No exchange rate, real-money equivalence or payout entitlement follows from
  the integer units alone.

## Server-to-server authorisation

Developer operations use OAuth 2 client-credentials **or equivalent secure
machine-to-machine authentication**; this draft describes scoped bearer tokens
in OpenAPI. Only a trusted backend can hold credentials. Tokens are scoped to
`checkout:create`, `checkout:read`, `refund:create`, `refund:read`, and
`transaction:read`. Merchant identity derives from the token, not request data.
The operator MUST validate access per resource (including merchant ownership).
Tokens MUST NOT be embedded in browsers, game binaries or mobile applications.
Any production authentication profile must follow current OAuth security guidance.

No token endpoint or issuer is currently deployed; URLs in the OpenAPI document
use reserved `.example` hostnames only.

## Checkout lifecycle

1. Backend sends `POST /v1/checkouts` with its own `merchant_order_id`, price in
   `amount_minor`, redirect URLs pre-registered with the operator, and a unique
   `Idempotency-Key` (UUID) for the request body. The amount is locked for the
   lifetime of the session. A merchant must bind the order to a server-validated
   game purchase and user session before initiating checkout.
2. Operator returns `201` with opaque `checkout_id`, approved `checkout_url`,
   `state=open`, and an expiration timestamp. The player navigates there.
3. Wallet authenticates the player, displays the merchant and amount, and
   requires explicit affirmative consent. If there are insufficient funds,
   no currency can be created as part of this step.
4. Operator posts an atomic, balanced transaction and changes state from
   `open` to `completed`; exactly one spend posting can occur for a checkout.
   Completion is only valid after the ledger commit succeeds.
5. Merchant gets a signed `checkout.completed` event (at-least-once delivery)
   and independently retrieves `GET /v1/checkouts/{checkout_id}`. Only a
   verified `completed` state may trigger fulfilment. Fulfilment is idempotent
   by the merchant's own order ID or `checkout_id`, and must verify the returned
   amount, currency and expected merchant order ID.
6. Unpaid sessions become `expired`, may be `cancelled`, and cannot complete
   later. Success redirects, webhook delivery and browser query parameters are
   **not** sufficient proof of payment.

States: `open → completed | cancelled | expired`. Terminal states cannot be
changed back to `open`. Subsequent refunds are separate records and do not
rewrite the original checkout or its posted journal entries.

## Refund lifecycle

A merchant requests `POST /v1/refunds` for a completed checkout it owns. The
operator MUST NOT accept a refund exceeding the unrefunded amount (including
pending requests reserved against that balance). A refund request initially
returns `202 pending`; it later becomes `succeeded` or `rejected`. On success,
a reversal/counter-entry is posted atomically and the player's wallet is
credited according to applicable settlement rules. The original transaction
remains auditable and immutable. Developer payout clawbacks and dispute
handling require a separate enforceable commercial policy, not described here.

Refunds and chargebacks are distinct: payment funding reversal may affect the
network's reserves and requires an operator risk process. This interface does
not grant a merchant the ability to generate GC by repeatedly requesting
refunds.

## Idempotency and concurrency

- `Idempotency-Key` is mandatory for both POST operations. Its scope is the
  merchant, method and path; duplicate requests with the same key and identical
  normalized body MUST return the same operation resource/result, without any
  second side effect. Reuse with different bodies MUST return `409` with a
  problem-detail response.
- The operator SHOULD retain keys for at least 24 hours and MUST document its
  retention window before a live deployment. Even after expiration of the
  idempotency window, a unique merchant order constraint and single-use
  checkout transaction prevent duplicate charge for the same order.
- Authorisation, amount checks, concurrency checks and journal posting MUST
  occur in a single serializable or equivalently atomic operation.
- Network timeouts have unknown outcomes. Clients MUST query by known resource
  ID or retry an identical request with the same key; they MUST NOT generate
  another key immediately after a timeout for the same operation.

## Events and reconciliation

Notifications are signed over raw bytes using a per-merchant secret and a
Unix timestamp, with `HMAC-SHA256(secret, utf8(timestamp + '.') || rawBody)`.
Headers: `Guildcoin-Timestamp` and `Guildcoin-Signature: v1=<lowercase hex>`.
Verification MUST use the unmodified body, constant-time compare, a short clock
window and duplicate-event detection by event ID. Rotate secrets with an
explicit overlap procedure, never log them, and restrict webhook destinations.

Events may be delivered more than once or out of order. Merchant backends
SHOULD query the authoritative checkout/refund resource and use the
`GET /v1/transactions` feed for reconciliation. Events provide only an opaque
resource ID, not an authorisation token or sensitive player information.

## Accounting and trust invariants

For any actual implementation, independent reviewers should be able to test:

1. Currency cannot be issued without previously captured funding or an
   explicitly prefunded treasury obligation (the funding model itself requires
   regulatory/accounting review).
2. Every posted GC journal transaction is append-only, uses one unit of account,
   and has equal total debits and credits. Corrections use reversing entries.
3. No wallet can spend more confirmed GC than its available balance; pending
   claims are reserved to prevent concurrent double spend.
4. Checkout completion and ledger posting are atomic; retries do not generate
   new spend or earnings.
5. Merchant receivables, held reserves and paid settlements reconcile to
   accepted developer spend and subsequent adjustments. An accounting proof of
   ledger consistency is **not** equivalent to proof of reserve sufficiency.
6. The operator must separately reconcile issued supply, outstanding GC
   obligations, funding assets, chargebacks and payouts, with independent
   audits before live money handling. No audited proof exists today.
7. Player cash-out, speculative exchange markets and external token trading are
   not supported by this proposed protocol.

## Errors

Errors are `application/problem+json` (RFC 9457). They include `type`, `title`,
`status`, a stable `code`, and optional `request_id`, while excluding secrets,
account balances of other users and any sensitive raw provider errors.
Expected classes include invalid input (400), missing credentials (401),
insufficient scope (403), not found or not owned (404), replay/key mismatch
(409), funding/availability limits (422), rate limits (429), and service
failures (5xx). Do not auto-retry 4xx responses except documented rate limits.

## Compatibility and versioning

- Major API version appears in the URL (`/v1`). `v0.1.0` is only the public
  *draft specification version*, not an available v1 service.
- Additive fields may be introduced. Clients MUST ignore unknown response
  properties and MUST NOT infer a new payment state from an unrecognised value.
  Unrecognised states must be treated as **not completed**.
- Breaking behaviour requires a new protocol revision and public migration
  period once real adopters exist.

## Intentionally unresolved decisions

- Identity/account linking, parental and underage accounts, player transfer
  policies, account recovery, regional restrictions and fraud signals.
- App-store restrictions (including whether host checkout is permissible in a
  given distribution channel), tax, AML/CTF and stored-value regulation.
- Retail/fiat pricing, issuer of record, reserve rules, redemption entitlement,
  developer rate, payout timelines, disputes and insolvency protection.
- Governance of merchants and sanctions, independent proofs, key management,
  risk limits, webhooks retries and SLA.

**Feedback wanted:** See [REVIEW.md](REVIEW.md). These are design questions, not
promises or commercial terms.