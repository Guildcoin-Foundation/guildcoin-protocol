# Illustrative checkout (no working endpoint)

An indie game backend creates a server-side order for 12.50 GC and receives a
confirmed opaque checkout URL. `sandbox-api.guildcoin.example` is a reserved
example hostname; these requests cannot be executed as written.

```http
POST /v1/checkouts HTTP/1.1
Host: sandbox-api.guildcoin.example
Authorization: Bearer <SERVER_TOKEN>
Idempotency-Key: 0ad091a8-cbaa-4ef8-9eac-29c9475278c5
Content-Type: application/json

{
  "merchant_order_id": "order-9df283",
  "amount_minor": "1250",
  "currency": "GC",
  "description": "A cosmetic outfit",
  "return_url": "https://game.example/checkout/return",
  "cancel_url": "https://game.example/checkout/cancel"
}
```

```json
{
  "id": "chk_79b2c8e3",
  "merchant_order_id": "order-9df283",
  "amount_minor": "1250",
  "currency": "GC",
  "state": "open",
  "checkout_url": "https://sandbox-wallet.guildcoin.example/checkout/chk_79b2c8e3",
  "created_at": "2026-10-10T09:00:00Z",
  "expires_at": "2026-10-10T09:15:00Z",
  "transaction_id": null
}
```

Game client redirects to `checkout_url`. **Returning from the redirect never
means the purchase has completed**. The wallet handles player authentication,
consent and balance verification.

The server receives a `checkout.completed` event, verifies its HMAC signature,
fetches `GET /v1/checkouts/chk_79b2c8e3`, checks `state=completed`,
`amount_minor=1250`, `currency=GC`, and the local `merchant_order_id`, then
fulfils that local order exactly once. It also reconciles the `transaction_id`
with the transaction feed. There is no fiat payout or purchase-channel fee
specified by this example.
