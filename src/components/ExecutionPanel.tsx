import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Intent, ParsedCommand } from '@/types';
import { AlertTriangle, X, ArrowRight, Loader2, Eye, Zap, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateSummary } from '@/lib/summary';

interface ExecutionPanelProps {
  command: ParsedCommand;
  onConfirm: () => void;
  onCancel: () => void;
  onFieldChange: (field: string, value: any) => void;
}

// ─── Intent metadata ──────────────────────────────────────────────────────────

const INTENT_META: Record<string, { label: string; category: string; destructive: boolean; accent: string }> = {
  [Intent.CREATE_LISTING]:              { label: 'Create Listing',         category: 'Inventory',   destructive: false, accent: 'blue'    },
  [Intent.UPDATE_PRICE]:                { label: 'Update Price',           category: 'Pricing',     destructive: false, accent: 'emerald' },
  [Intent.ENABLE_OFFERS]:               { label: 'Enable Offers',          category: 'Negotiation', destructive: false, accent: 'purple'  },
  [Intent.BULK_PRICE_ADJUST]:           { label: 'Bulk Price Adjust',      category: 'Pricing',     destructive: true,  accent: 'amber'   },
  [Intent.RESPOND_TO_BUYER]:            { label: 'Respond to Buyer',       category: 'Negotiation', destructive: false, accent: 'pink'    },
  [Intent.END_LISTING]:                 { label: 'End Listing',            category: 'Inventory',   destructive: true,  accent: 'red'     },
  [Intent.DUPLICATE_LISTING]:           { label: 'Duplicate Listing',      category: 'Inventory',   destructive: false, accent: 'sky'     },
  [Intent.SEND_OFFER_TO_WATCHERS]:      { label: 'Send Offer to Watchers', category: 'Negotiation', destructive: false, accent: 'violet'  },
  [Intent.UPDATE_FULFILLMENT_SETTINGS]: { label: 'Update Fulfillment',     category: 'Account',     destructive: false, accent: 'amber'   },
  [Intent.BULK_END_LISTINGS]:           { label: 'Bulk End Listings',      category: 'Inventory',   destructive: true,  accent: 'rose'    },
};

const ACCENT_BADGE: Record<string, string> = {
  blue:    'border-blue-500/30 bg-blue-500/10 text-blue-300',
  emerald: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  purple:  'border-purple-500/30 bg-purple-500/10 text-purple-300',
  amber:   'border-amber-500/30 bg-amber-500/10 text-amber-300',
  pink:    'border-pink-500/30 bg-pink-500/10 text-pink-300',
  red:     'border-red-500/30 bg-red-500/10 text-red-300',
  sky:     'border-sky-500/30 bg-sky-500/10 text-sky-300',
  violet:  'border-violet-500/30 bg-violet-500/10 text-violet-300',
  rose:    'border-rose-500/30 bg-rose-500/10 text-rose-300',
};

// ─── Preview Diff hook ────────────────────────────────────────────────────────

interface DiffLine {
  label: string;
  before?: string;
  after?: string;
  warning?: string;
  info?: string;
}

function useDiffPreview(command: ParsedCommand): { lines: DiffLine[]; loading: boolean } {
  const [lines, setLines] = useState<DiffLine[]>([]);
  const [loading, setLoading] = useState(false);
  const f = command.fields as any;

  useEffect(() => {
    setLines([]);
    const intent = command.intent;

    const needsData = [
      Intent.UPDATE_PRICE, Intent.BULK_PRICE_ADJUST,
      Intent.END_LISTING, Intent.BULK_END_LISTINGS,
      Intent.SEND_OFFER_TO_WATCHERS, Intent.DUPLICATE_LISTING,
    ].includes(intent as Intent);

    if (!needsData) return;

    setLoading(true);
    fetch('/api/active-listings')
      .then(r => r.json())
      .then(data => {
        const items: any[] = data.items || [];
        const short = (t: string) => t.replace(/FREE\s*SHIP.*/i, '').trim().substring(0, 55);

        if (intent === Intent.UPDATE_PRICE && f.listing_id) {
          const item = items.find(i => i.itemId === f.listing_id);
          setLines(item
            ? [{ label: short(item.title), before: `$${parseFloat(item.price).toFixed(2)}`, after: f.new_price != null ? `$${parseFloat(f.new_price).toFixed(2)}` : '—' }]
            : [{ label: `Listing ${f.listing_id}`, info: 'Not found in active listings' }]
          );
        }

        else if (intent === Intent.BULK_PRICE_ADJUST && f.adjustment_type && f.adjustment_value != null) {
          const total = items.reduce((s: number, i: any) => s + parseFloat(i.price), 0);
          const avg = total / (items.length || 1);
          const factor = f.adjustment_type === 'percentage' ? (1 + f.adjustment_value / 100) : 1;
          const fixed = f.adjustment_type === 'fixed' ? f.adjustment_value * items.length : 0;
          setLines([
            { label: `${items.length} listings`, before: `avg $${avg.toFixed(2)}`, after: `avg $${(f.adjustment_type === 'percentage' ? avg * factor : avg + f.adjustment_value).toFixed(2)}` },
            { label: 'Total listed value', before: `$${total.toFixed(0)}`, after: `$${(total * factor + fixed).toFixed(0)}` },
          ]);
        }

        else if (intent === Intent.END_LISTING && f.listing_id) {
          const item = items.find(i => i.itemId === f.listing_id);
          if (item) {
            const warns: string[] = [];
            if (Number(item.watchCount) > 0) warns.push(`${item.watchCount} watchers`);
            if (Number(item.bids) > 0) warns.push(`${item.bids} active bids`);
            setLines([
              { label: short(item.title), before: `$${parseFloat(item.price).toFixed(2)}`, after: 'ENDED' },
              ...(warns.length ? [{ label: '⚠ Caution', warning: warns.join(' · ') + ' will be lost' }] : []),
            ]);
          }
        }

        else if (intent === Intent.BULK_END_LISTINGS) {
          let targets = [...items];
          if (f.older_than_days != null) targets = targets.filter(i => i.startTime && Math.floor((Date.now() - new Date(i.startTime).getTime()) / 86400000) >= f.older_than_days);
          if (f.below_price != null) targets = targets.filter(i => parseFloat(i.price) < f.below_price);
          if (f.filter_condition) targets = targets.filter(i => (i.condition || '').toLowerCase() === f.filter_condition);
          const totalVal = targets.reduce((s: number, i: any) => s + parseFloat(i.price), 0);
          const withWatchers = targets.filter(i => Number(i.watchCount) > 0).length;
          setLines([
            { label: 'Listings matched', before: `${items.length} active`, after: `${targets.length} to end` },
            { label: 'Capital removed', info: `$${totalVal.toFixed(0)} in listed value` },
            ...(withWatchers > 0 ? [{ label: '⚠ Caution', warning: `${withWatchers} of these have watchers` }] : []),
          ]);
        }

        else if (intent === Intent.SEND_OFFER_TO_WATCHERS && f.listing_id) {
          const item = items.find(i => i.itemId === f.listing_id);
          if (item) {
            const p = parseFloat(item.price);
            const offered = f.discount_type === 'percentage' ? p * (1 - f.discount_value / 100) : p - f.discount_value;
            setLines([
              { label: short(item.title), before: `$${p.toFixed(2)}`, after: `$${Math.max(0.99, offered).toFixed(2)} offered` },
              { label: `${item.watchCount} watcher${Number(item.watchCount) !== 1 ? 's' : ''}`, info: 'will receive this targeted offer' },
            ]);
          }
        }

        else if (intent === Intent.DUPLICATE_LISTING && f.listing_id) {
          const item = items.find(i => i.itemId === f.listing_id);
          if (item) {
            setLines([
              { label: short(item.title), info: 'Source listing' },
              { label: 'Price', before: `$${parseFloat(item.price).toFixed(2)}`, after: f.price_override ? `$${parseFloat(f.price_override).toFixed(2)}` : 'unchanged' },
            ]);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [command.intent, JSON.stringify(command.fields)]);

  return { lines, loading };
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ExecutionPanel({ command, onConfirm, onCancel, onFieldChange }: ExecutionPanelProps) {
  const meta = INTENT_META[command.intent];
  const isDestructive = meta?.destructive ?? false;
  const isUnknown = command.intent === Intent.UNKNOWN;
  const summary = !isUnknown ? generateSummary(command) : '';
  const { lines: diffLines, loading: diffLoading } = useDiffPreview(command);
  const badgeClass = meta ? (ACCENT_BADGE[meta.accent] ?? ACCENT_BADGE.blue) : 'border-slate-500/30 bg-slate-500/10 text-slate-300';
  const showDiff = diffLines.length > 0 || diffLoading;

  // Unknown intent
  if (isUnknown) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="w-full glass-panel rounded-xl border border-red-500/20 bg-red-500/5">
        <div className="p-5 flex items-start gap-4">
          <div className="p-2.5 bg-red-500/10 rounded-lg border border-red-500/20 shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white text-sm">Intent Not Recognized</h3>
            <p className="text-slate-400 text-sm mt-1 leading-relaxed">
              Try being more specific — e.g. "Update listing 12345 price to $50" or "End listing 12345 — out of stock".
            </p>
            <button onClick={onCancel} className="mt-3 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-sm transition-colors">
              Try Again
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={cn('w-full glass-panel rounded-xl border overflow-hidden', isDestructive ? 'border-red-500/20' : 'border-white/8')}>

      {/* Header */}
      <div className={cn('px-5 py-3 border-b flex items-center justify-between', isDestructive ? 'border-red-500/15 bg-red-500/5' : 'border-white/5')}>
        <div className="flex items-center gap-3">
          <span className={cn('text-[10px] font-mono font-bold px-2 py-1 rounded border uppercase tracking-wider', badgeClass)}>
            {meta?.category ?? 'Command'}
          </span>
          <span className="text-sm font-semibold text-white">{meta?.label ?? command.intent}</span>
          <span className="text-[10px] font-mono text-slate-500">{(command.confidence * 100).toFixed(0)}% conf</span>
        </div>
        <div className="flex items-center gap-2">
          {isDestructive && (
            <span className="flex items-center gap-1 text-red-400 text-[10px] font-mono">
              <ShieldAlert className="w-3 h-3" />CONFIRM REQUIRED
            </span>
          )}
          <button onClick={onCancel} className="p-1 text-slate-500 hover:text-slate-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="px-5 py-3 border-b border-white/5">
        <p className="text-sm text-slate-300 leading-relaxed">{summary}</p>
      </div>

      {/* Fields */}
      <div className="p-5 grid grid-cols-2 gap-4">
        {Object.entries(command.fields).map(([key, value]) => (
          <div key={key} className="space-y-1.5">
            <label className="text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-wider">
              {key.replace(/_/g, ' ')}
            </label>
            <input
              type="text"
              value={value === null || value === undefined ? '' : String(value)}
              onChange={e => onFieldChange(key, e.target.value)}
              className="w-full px-3 py-2 bg-slate-900/60 border border-white/8 rounded-lg text-sm font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all"
            />
          </div>
        ))}
      </div>

      {/* Preview Diff */}
      {showDiff && (
        <div className="mx-5 mb-5 rounded-lg border border-white/8 bg-slate-950/60 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Preview Diff</span>
            {diffLoading && <Loader2 className="w-3 h-3 text-slate-600 animate-spin ml-auto" />}
          </div>
          {diffLoading && diffLines.length === 0 ? (
            <div className="px-4 py-3 text-xs text-slate-600 font-mono">Fetching listing data…</div>
          ) : (
            <div className="divide-y divide-white/5">
              {diffLines.map((line, i) => (
                <div key={i} className="px-4 py-2.5 flex items-center gap-3 min-w-0">
                  <span className="text-[11px] text-slate-400 truncate flex-1">{line.label}</span>
                  {line.before && line.after && (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-mono text-slate-600 line-through">{line.before}</span>
                      <ArrowRight className="w-3 h-3 text-slate-700" />
                      <span className={cn('text-[11px] font-mono font-bold',
                        line.after === 'ENDED' ? 'text-red-400' : isDestructive ? 'text-amber-400' : 'text-emerald-400'
                      )}>{line.after}</span>
                    </div>
                  )}
                  {line.warning && (
                    <span className="text-[11px] font-mono text-red-400 shrink-0 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />{line.warning}
                    </span>
                  )}
                  {line.info && !line.before && (
                    <span className="text-[11px] font-mono text-slate-500 shrink-0">{line.info}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="px-5 pb-5 flex items-center justify-between">
        <button onClick={onCancel} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-300 transition-colors">
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all',
            isDestructive ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'
          )}
        >
          {isDestructive
            ? <><ShieldAlert className="w-4 h-4" />Confirm &amp; Execute</>
            : <><Zap className="w-4 h-4" />Execute Command</>
          }
        </button>
      </div>
    </motion.div>
  );
}
