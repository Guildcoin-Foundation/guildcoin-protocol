/** Guildcoin protocol v0.1 discussion draft: interfaces only, not a client. */
export type GcMinor = string; // decimal integer, 1 GC = 100 minor units (draft)
export type UtcTimestamp = string;
export type CheckoutState = "open" | "completed" | "cancelled" | "expired";
export type RefundState = "pending" | "succeeded" | "rejected";
export type EventType = "checkout.completed" | "refund.succeeded" | "refund.rejected";

export interface CreateCheckout {
  merchant_order_id: string;
  amount_minor: GcMinor;
  currency: "GC";
  description: string;
  return_url: string;
  cancel_url: string;
}

export interface Checkout {
  id: string;
  merchant_order_id: string;
  amount_minor: GcMinor;
  currency: "GC";
  state: CheckoutState;
  checkout_url: string;
  created_at: UtcTimestamp;
  expires_at: UtcTimestamp;
  transaction_id: string | null;
}

export interface CreateRefund {
  checkout_id: string;
  amount_minor: GcMinor;
  reason: "requested_by_player" | "fulfillment_failed" | "other";
}

export interface Refund {
  id: string;
  checkout_id: string;
  amount_minor: GcMinor;
  state: RefundState;
  created_at: UtcTimestamp;
  transaction_id: string | null;
}

export interface MerchantTransaction {
  id: string;
  checkout_id: string;
  refund_id: string | null;
  kind: "checkout" | "refund";
  amount_minor: GcMinor;
  currency: "GC";
  occurred_at: UtcTimestamp;
}

export interface TransactionPage {
  data: MerchantTransaction[];
  next_cursor: string | null;
}

export interface GuildcoinWebhookEvent {
  id: string;
  type: EventType;
  occurred_at: UtcTimestamp;
  data: { id: string };
}

/** All methods run on a confidential game server, never a game client. */
export interface GuildcoinMerchantClient {
  /** Must re-use the same idempotency key after a timeout for the same order. */
  createCheckout(input: CreateCheckout, idempotencyKey: string): Promise<Checkout>;
  getCheckout(checkoutId: string): Promise<Checkout>;
  createRefund(input: CreateRefund, idempotencyKey: string): Promise<Refund>;
  getRefund(refundId: string): Promise<Refund>;
  listTransactions(cursor?: string, limit?: number): Promise<TransactionPage>;
}

/** Signature verification must happen on raw request bytes, before JSON parsing. */
export interface GuildcoinWebhookVerifier {
  verify(rawBody: Uint8Array, timestampSeconds: string, signatureHeader: string): Promise<GuildcoinWebhookEvent>;
}
