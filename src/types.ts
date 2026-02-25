export enum Intent {
  CREATE_LISTING                = "CREATE_LISTING",
  UPDATE_PRICE                  = "UPDATE_PRICE",
  ENABLE_OFFERS                 = "ENABLE_OFFERS",
  BULK_PRICE_ADJUST             = "BULK_PRICE_ADJUST",
  RESPOND_TO_BUYER              = "RESPOND_TO_BUYER",
  END_LISTING                   = "END_LISTING",
  DUPLICATE_LISTING             = "DUPLICATE_LISTING",
  SEND_OFFER_TO_WATCHERS        = "SEND_OFFER_TO_WATCHERS",
  UPDATE_FULFILLMENT_SETTINGS   = "UPDATE_FULFILLMENT_SETTINGS",
  BULK_END_LISTINGS             = "BULK_END_LISTINGS",
  UNKNOWN                       = "UNKNOWN",
}

export type Condition       = "new" | "used" | "refurbished";
export type ShippingPolicy  = "free" | "calculated" | "flat";
export type AdjustmentType  = "percentage" | "fixed";
export type EndReason       = "out_of_stock" | "damaged" | "other";
export type DiscountType    = "percentage" | "fixed";

// ─── Field interfaces ─────────────────────────────────────────────────────────

export interface CreateListingFields {
  title: string;
  price: number;
  condition: Condition;
  quantity?: number;
  auto_accept_threshold?: number;
  shipping_policy?: ShippingPolicy;
  handling_time?: number;
}

export interface UpdatePriceFields {
  listing_id: string;
  new_price: number;
}

export interface EnableOffersFields {
  listing_id: string;
  auto_accept_threshold?: number;
}

export interface BulkPriceAdjustFields {
  adjustment_type: AdjustmentType;
  adjustment_value: number;
  filter_condition?: Condition;
}

export interface RespondToBuyerFields {
  message: string;
  buyer_id?: string;
  listing_id?: string;
}

export interface EndListingFields {
  listing_id: string;
  reason?: EndReason;
}

export interface DuplicateListingFields {
  listing_id: string;
  price_override?: number;
  quantity_override?: number;
}

export interface SendOfferToWatchersFields {
  listing_id: string;
  discount_type: DiscountType;
  discount_value: number;
}

export interface UpdateFulfillmentSettingsFields {
  handling_time?: number;
  vacation_mode?: boolean;
  auto_reply_message?: string;
}

export interface BulkEndListingsFields {
  filter_condition?: Condition;
  older_than_days?: number;
  below_price?: number;
}

// ─── Union + command types ────────────────────────────────────────────────────

export type IntentFields =
  | CreateListingFields
  | UpdatePriceFields
  | EnableOffersFields
  | BulkPriceAdjustFields
  | RespondToBuyerFields
  | EndListingFields
  | DuplicateListingFields
  | SendOfferToWatchersFields
  | UpdateFulfillmentSettingsFields
  | BulkEndListingsFields
  | Record<string, any>;

export interface ParsedCommand {
  intent: Intent;
  confidence: number;
  fields: IntentFields;
}

export interface ItemLog {
  itemId: string;
  title: string;
  oldPrice: number;
  newPrice: number;
  success: boolean;
  error?: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  raw_input: string;
  intent: Intent;
  confidence: number;
  status: "success" | "pending" | "failed" | "requires_confirmation";
  details: string;
  itemLogs?: ItemLog[];
}

// ─── Messages ────────────────────────────────────────────────────────────────

export interface Message {
  message_id: string;
  buyer_id: string;
  buyer_name: string;
  buyer_rating: number;
  message_text: string;
  timestamp: string;
  status: 'answered' | 'unanswered';
  item_id?: string;
  listing_title?: string;
}

export interface MessageThread {
  messages: Message[];
  buyer_info: { id: string; rating: number; transaction_count: number };
  last_response_time?: string;
}

// ─── Notifications ───────────────────────────────────────────────────────────

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}
