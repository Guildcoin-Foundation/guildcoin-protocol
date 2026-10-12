# Guildcoin Protocol — Discussion Draft v0.1

> **Proposal only. Not a deployed API, production SDK, asset, payment service,
> legally adopted standard, or promise of redemption.**

A **public, implementation-agnostic merchant interface** for a potential funded,
portable in-game currency that participating independent games could accept.

This repository is deliberately separate from the private website, payments,
ledger implementation, infrastructure, operational configurations and customer data.
There are **no working service endpoints**, credentials or production environments.

## Quick review

- [Protocol semantics and state machines](SPEC.md)
- [OpenAPI 3.1 contract](openapi/guildcoin-v0.1.yaml)
- [TypeScript SDK *interfaces only*](sdk/typescript/src/index.ts)
- [Illustrative checkout sequence](examples/checkout-flow.md)
- [Security properties and unresolved threats](SECURITY.md)
- [Questions for independent reviewers](REVIEW.md)
- [How to suggest changes](CONTRIBUTING.md)

## Integration model in four steps

1. A game's **trusted backend** requests a checkout session, using a narrowly
   scoped server credential and an idempotency key.
2. The player explicitly reviews and authorises the payment in a **hosted wallet**.
   The game cannot debit a wallet merely by supplying a player identifier.
3. After an atomic ledger posting, the backend confirms the checkout state from
   the API; signed webhooks are only a delivery hint.
4. The game fulfils the purchase **once**, while a merchant-facing transaction
   feed enables reconciliation. Separate, undisclosed settlement policy would
   determine any fiat developer payout.

The client-side API is intentionally **not** a privileged SDK; any game-client
integration should only redirect a player to an approved hosted checkout URL.

## Scope

| In this draft | Deliberately out of scope / unresolved |
| --- | --- |
| Create and retrieve checkout sessions | Actual identity provider or wallet experience |
| Merchant-scoped transaction receipts | Issuance and payment processing internals |
| Refund request and status model | Pricing, FX conversion, payout share and tax |
| Signed event notification requirements | Ledger database and deployment topology |
| Proposed security and accounting invariants | App-store permissions and regulatory approval |

This is a **single proposed operator-hosted interface**, not yet a federation or
multi-operator standard. Public protocols and SDK contracts do not themselves
prove financial reserves or operator integrity.

### Contributing

Please read [REVIEW.md](REVIEW.md) for the most important open questions and use
GitHub issues or pull requests to challenge assumptions. Nothing here should be
interpreted as acceptance of a merchant, a legal opinion, or an undertaking to
launch.

## Licensing

The draft and sample interface definitions are offered under the MIT License;
see [LICENSE](LICENSE). The public repository can evolve under community review.
