import {
  Intent, ParsedCommand,
  CreateListingFields, UpdatePriceFields, EnableOffersFields,
  BulkPriceAdjustFields, RespondToBuyerFields, EndListingFields,
  DuplicateListingFields, SendOfferToWatchersFields,
  UpdateFulfillmentSettingsFields, BulkEndListingsFields,
} from '@/types';

export function generateSummary(command: ParsedCommand): string {
  const { intent, fields } = command;

  switch (intent) {
    case Intent.CREATE_LISTING: {
      const f = fields as CreateListingFields;
      return `Create a new listing for "${f.title}" at $${f.price}.`;
    }
    case Intent.UPDATE_PRICE: {
      const f = fields as UpdatePriceFields;
      return `Update listing ${f.listing_id} price to $${f.new_price}.`;
    }
    case Intent.ENABLE_OFFERS: {
      const f = fields as EnableOffersFields;
      return `Enable Best Offer on listing ${f.listing_id}${f.auto_accept_threshold ? ` with auto-accept at $${f.auto_accept_threshold}` : ''}.`;
    }
    case Intent.BULK_PRICE_ADJUST: {
      const f = fields as BulkPriceAdjustFields;
      const dir = f.adjustment_value > 0 ? 'Increase' : 'Decrease';
      const val = Math.abs(f.adjustment_value);
      const unit = f.adjustment_type === 'percentage' ? '%' : '$';
      const scope = f.filter_condition ? ` all ${f.filter_condition} listings` : ' all listings';
      return `${dir}${scope} by ${val}${unit}.`;
    }
    case Intent.RESPOND_TO_BUYER: {
      const f = fields as RespondToBuyerFields;
      return `Send message to buyer${f.buyer_id ? ` ${f.buyer_id}` : ''}: "${f.message}"`;
    }
    case Intent.END_LISTING: {
      const f = fields as EndListingFields;
      return `End listing ${f.listing_id}${f.reason ? ` — reason: ${f.reason.replace(/_/g, ' ')}` : ''}.`;
    }
    case Intent.DUPLICATE_LISTING: {
      const f = fields as DuplicateListingFields;
      const overrides: string[] = [];
      if (f.price_override != null) overrides.push(`price $${f.price_override}`);
      if (f.quantity_override != null) overrides.push(`qty ${f.quantity_override}`);
      return `Duplicate listing ${f.listing_id}${overrides.length ? ` with ${overrides.join(', ')}` : ''}.`;
    }
    case Intent.SEND_OFFER_TO_WATCHERS: {
      const f = fields as SendOfferToWatchersFields;
      const disc = f.discount_type === 'percentage' ? `${f.discount_value}% off` : `$${f.discount_value} off`;
      return `Send ${disc} offer to all watchers on listing ${f.listing_id}.`;
    }
    case Intent.UPDATE_FULFILLMENT_SETTINGS: {
      const f = fields as UpdateFulfillmentSettingsFields;
      const parts: string[] = [];
      if (f.handling_time != null) parts.push(`handling time: ${f.handling_time} day${f.handling_time !== 1 ? 's' : ''}`);
      if (f.vacation_mode != null) parts.push(`vacation mode: ${f.vacation_mode ? 'ON' : 'OFF'}`);
      if (f.auto_reply_message) parts.push(`auto-reply message set`);
      return `Update fulfillment settings: ${parts.join(', ') || 'no changes specified'}.`;
    }
    case Intent.BULK_END_LISTINGS: {
      const f = fields as BulkEndListingsFields;
      const filters: string[] = [];
      if (f.filter_condition) filters.push(`condition: ${f.filter_condition}`);
      if (f.older_than_days != null) filters.push(`older than ${f.older_than_days} days`);
      if (f.below_price != null) filters.push(`priced below $${f.below_price}`);
      return `End all listings${filters.length ? ` where ${filters.join(' and ')}` : ''}.`;
    }
    default:
      return 'Execute command with the specified parameters.';
  }
}
