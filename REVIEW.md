# Review guide: challenge the assumptions

The goal is external criticism, not endorsements or AI-generated approval.
Please distinguish **protocol correctness**, **financial safety**, **platform
feasibility**, and **developer usefulness**. Each is a separate question.

## Reviewer checklist

1. **Player authorisation:** Can an untrusted game server create a charge or
   approve one without the player's explicit wallet consent?
2. **Double spend:** Could two checkouts race, exploit a timeout, or bypass an
   idempotency constraint to charge the same GC twice?
3. **Developer attribution:** Can the wrong merchant receive earnings or a
   player fabricate a completed purchase via redirects/webhooks?
4. **Money conservation:** What funding, refund, chargeback, reserve and payout
   journal entries must exist to reconcile obligations to assets?
5. **Consumer rules:** Could the concept violate app-store requirements or
   stored-value / money-transmission regulations? Identify actual launch gates.
6. **Privacy and abuse:** Are checkout metadata and player cross-game activity
   minimized sufficiently? How might purchases enable tracking across titles?
7. **Operator trust:** What exactly can be independently verified, and what
   remains a promise by a trusted central operator?
8. **SDK ergonomics:** Could a small game integrate using only server routes,
   hosted checkout, a signed event and one fulfilment handler?
9. **Refund disputes:** How would late chargebacks, game bans, payout reversal,
   insolvency, abandoned goods and fraud rings be handled?
10. **Governance:** Who can change protocol, payout rates and membership rules;
    what credible path exists toward developer representation?

## How to give actionable feedback

For every issue include the violated invariant, a minimal reproduction or
transaction sequence, the resulting harm, and a suggested rule or test. Mark
hypothetical assumptions explicitly. Prioritise **blocking** issues before
minor naming changes or architectural preferences.

## Prompt for an independent AI review

> You are reviewing a public discussion draft, not an implemented payment
> system. Read SPEC.md, SECURITY.md, openapi/guildcoin-v0.1.yaml and the SDK
> interfaces. Find the strongest reasons this protocol should **not** launch.
> Look for inconsistent state transitions, double-spend and duplicate fulfilment
> paths, cash-liability accounting failures, replay/authentication gaps,
> refunds and chargebacks, merchant isolation, regulatory and store-policy
> constraints, developer incentives, and untestable security claims. Rank
> findings by severity, cite the exact contract section, propose falsifiable
> invariants or tests, and distinguish missing policy decisions from bugs in
> the draft. Do not reward the project merely for being open-source.