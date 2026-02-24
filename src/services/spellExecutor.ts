/**
 * spellExecutor.ts
 * Maps parsed command intents → real backend API calls.
 * Called from App.tsx when the user confirms a command in ExecutionPanel.
 */
import { ParsedCommand, Intent, ItemLog } from '../types';

export interface SpellResult {
  success: boolean;
  message: string;
  data?: { itemLogs?: ItemLog[] };
}

// Helper: fetch all active listings
async function fetchListings(): Promise<{ success: boolean; items: any[]; error?: string }> {
  const r = await fetch('/api/active-listings');
  const d = await r.json();
  return { success: !!d.success, items: d.items || [], error: d.error };
}

// Helper: apply price change to a single listing
async function applyPrice(itemId: string, price: number): Promise<{ success: boolean; error?: string }> {
  const r = await fetch('/api/apply-optimization', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemId, changes: { price } }),
  });
  const d = await r.json();
  return { success: !!d.success, error: d.errors?.join(', ') || d.error };
}

export async function executeSpell(command: ParsedCommand): Promise<SpellResult> {
  const f = command.fields as any;

  switch (command.intent) {

    // ── UPDATE_PRICE ───────────────────────────────────────────────────────────
    case Intent.UPDATE_PRICE: {
      if (!f.listing_id || f.new_price == null) {
        return { success: false, message: 'Missing listing_id or new_price.' };
      }
      const result = await applyPrice(f.listing_id, f.new_price);
      if (result.success) {
        return { success: true, message: `✅ Listing ${f.listing_id} price updated to $${f.new_price}.` };
      }
      return { success: false, message: `❌ eBay error: ${result.error || 'Unknown'}` };
    }

    // ── BULK_PRICE_ADJUST ──────────────────────────────────────────────────────
    case Intent.BULK_PRICE_ADJUST: {
      if (!f.adjustment_type || f.adjustment_value == null) {
        return { success: false, message: 'Missing adjustment_type or adjustment_value.' };
      }
      const { success, items, error } = await fetchListings();
      if (!success) return { success: false, message: `Could not fetch listings: ${error}` };

      let adjusted = 0, failed = 0;
      const itemLogs: ItemLog[] = [];
      for (const item of items) {
        const cur = parseFloat(item.price) || 0;
        const next = Math.max(0.99, parseFloat(
          f.adjustment_type === 'percentage'
            ? (cur * (1 + f.adjustment_value / 100)).toFixed(2)
            : (cur + f.adjustment_value).toFixed(2)
        ));
        const r = await applyPrice(item.itemId, next);
        if (r.success) {
          adjusted++;
          itemLogs.push({ itemId: item.itemId, title: item.title || item.itemId, oldPrice: cur, newPrice: next, success: true });
        } else {
          failed++;
          itemLogs.push({ itemId: item.itemId, title: item.title || item.itemId, oldPrice: cur, newPrice: next, success: false, error: r.error || 'Unknown error' });
        }
      }
      return {
        success: adjusted > 0,
        message: `✅ Adjusted ${adjusted}/${items.length} listings.${failed ? ` ${failed} failed.` : ''}`,
        data: { itemLogs },
      };
    }

    // ── END_LISTING ────────────────────────────────────────────────────────────
    case Intent.END_LISTING: {
      if (!f.listing_id) return { success: false, message: 'Missing listing_id.' };
      try {
        const r = await fetch('/api/end-listing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId: f.listing_id, reason: f.reason || 'other' }),
        });
        const d = await r.json();
        if (d.success) return { success: true, message: `✅ Listing ${f.listing_id} ended.` };
        return {
          success: false,
          message: `END_LISTING requires /api/end-listing (eBay Trading API EndItem). Listing: ${f.listing_id}.`,
        };
      } catch {
        return {
          success: false,
          message: `END_LISTING requires /api/end-listing backend route. Listing: ${f.listing_id}, reason: ${f.reason || 'other'}.`,
        };
      }
    }

    // ── DUPLICATE_LISTING ──────────────────────────────────────────────────────
    case Intent.DUPLICATE_LISTING: {
      if (!f.listing_id) return { success: false, message: 'Missing listing_id.' };
      try {
        const r = await fetch('/api/duplicate-listing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            itemId: f.listing_id,
            priceOverride: f.price_override,
            quantityOverride: f.quantity_override,
          }),
        });
        const d = await r.json();
        if (d.success) {
          return { success: true, message: `✅ Listing ${f.listing_id} duplicated. New ID: ${d.newItemId || 'see eBay Seller Hub'}.` };
        }
        return {
          success: false,
          message: `DUPLICATE_LISTING requires /api/duplicate-listing (fetch GetItem + relist via AddItem). Source: ${f.listing_id}${f.price_override ? `, new price: $${f.price_override}` : ''}.`,
        };
      } catch {
        return {
          success: false,
          message: `DUPLICATE_LISTING requires /api/duplicate-listing backend route. Source listing: ${f.listing_id}.`,
        };
      }
    }

    // ── SEND_OFFER_TO_WATCHERS ─────────────────────────────────────────────────
    case Intent.SEND_OFFER_TO_WATCHERS: {
      if (!f.listing_id || !f.discount_type || f.discount_value == null) {
        return { success: false, message: 'Missing listing_id, discount_type, or discount_value.' };
      }
      if (f.discount_type === 'percentage' && f.discount_value > 40) {
        return { success: false, message: '⚠️ Safety cap: discount cannot exceed 40%. Reduce discount_value and retry.' };
      }
      try {
        const r = await fetch('/api/send-offer-to-watchers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId: f.listing_id, discountType: f.discount_type, discountValue: f.discount_value }),
        });
        const d = await r.json();
        if (d.success) return { success: true, message: `✅ Offer sent to watchers on listing ${f.listing_id}.` };
        return {
          success: false,
          message: `SEND_OFFER_TO_WATCHERS requires eBay Marketing API (sendOfferToInterestedBuyers). Listing: ${f.listing_id}, discount: ${f.discount_value}${f.discount_type === 'percentage' ? '%' : '$'} off.`,
        };
      } catch {
        return {
          success: false,
          message: `SEND_OFFER_TO_WATCHERS requires /api/send-offer-to-watchers backend route. Listing: ${f.listing_id}.`,
        };
      }
    }

    // ── UPDATE_FULFILLMENT_SETTINGS ────────────────────────────────────────────
    case Intent.UPDATE_FULFILLMENT_SETTINGS: {
      const updates: string[] = [];
      if (f.handling_time != null) updates.push(`handling time → ${f.handling_time}d`);
      if (f.vacation_mode != null) updates.push(`vacation mode → ${f.vacation_mode ? 'ON' : 'OFF'}`);
      if (f.auto_reply_message) updates.push(`auto-reply set`);
      if (!updates.length) return { success: false, message: 'No fulfillment settings specified.' };
      try {
        const r = await fetch('/api/update-fulfillment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(f),
        });
        const d = await r.json();
        if (d.success) return { success: true, message: `✅ Fulfillment updated: ${updates.join(', ')}.` };
        return {
          success: false,
          message: `UPDATE_FULFILLMENT_SETTINGS requires /api/update-fulfillment (eBay Account API). Changes: ${updates.join(', ')}.`,
        };
      } catch {
        return {
          success: false,
          message: `UPDATE_FULFILLMENT_SETTINGS requires /api/update-fulfillment backend route. Intended: ${updates.join(', ')}.`,
        };
      }
    }

    // ── BULK_END_LISTINGS ──────────────────────────────────────────────────────
    case Intent.BULK_END_LISTINGS: {
      const { success, items, error } = await fetchListings();
      if (!success) return { success: false, message: `Could not fetch listings: ${error}` };

      let targets = [...items];
      if (f.filter_condition) targets = targets.filter(i => (i.condition || '').toLowerCase() === f.filter_condition);
      if (f.older_than_days != null) {
        targets = targets.filter(i => {
          if (!i.startTime) return false;
          return Math.floor((Date.now() - new Date(i.startTime).getTime()) / 86400000) >= f.older_than_days;
        });
      }
      if (f.below_price != null) targets = targets.filter(i => parseFloat(i.price) < f.below_price);
      if (!targets.length) return { success: false, message: 'No listings matched your filter criteria.' };

      let ended = 0, failed = 0;
      for (const item of targets) {
        try {
          const r = await fetch('/api/end-listing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itemId: item.itemId, reason: 'other' }),
          });
          const d = await r.json();
          d.success ? ended++ : failed++;
        } catch { failed++; }
      }

      if (ended === 0) {
        return {
          success: false,
          message: `BULK_END_LISTINGS requires /api/end-listing route. ${targets.length} listings matched your filter would be ended.`,
        };
      }
      return {
        success: true,
        message: `✅ Ended ${ended}/${targets.length} listings.${failed ? ` ${failed} failed.` : ''}`,
      };
    }

    // ── ENABLE_OFFERS ──────────────────────────────────────────────────────────
    case Intent.ENABLE_OFFERS: {
      return {
        success: false,
        message: `Best Offer requires ReviseItem with BestOfferEnabled=true (eBay Trading API). Listing: ${f.listing_id || 'not specified'}.`,
      };
    }

    // ── CREATE_LISTING ─────────────────────────────────────────────────────────
    case Intent.CREATE_LISTING: {
      return {
        success: false,
        message: `📷 Creating a listing requires images. Open Vision Uplink, upload photos, and click "Initiate Analysis" to generate and publish the full listing.`,
      };
    }

    // ── RESPOND_TO_BUYER ───────────────────────────────────────────────────────
    case Intent.RESPOND_TO_BUYER: {
      return {
        success: false,
        message: `Messaging requires eBay GetMemberMessages + AddMemberMessageAAQToPartner (Trading API). Message staged: "${f.message}"`,
      };
    }

    default:
      return { success: false, message: `Unknown intent: ${command.intent}` };
  }
}
