import React, { useEffect, useState } from 'react';
import { Lightbulb, ArrowRight, TrendingUp, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Suggestion {
  id: string;
  type: 'pricing' | 'inventory' | 'seo';
  title: string;
  description: string;
  impact: string;
  action: string;
}

interface Listing {
  itemId: string;
  title: string;
  price: string | number;
  watchCount: string | number;
  bids: string | number;
  startTime: string | null;
  hitCount?: number;
}

interface SmartSuggestionsProps {
  onApply: (action: string) => void;
}

const EXAMPLE_SUGGESTIONS: Suggestion[] = [
  {
    id: 'example-1',
    type: 'pricing',
    title: 'Price 5% Below Market Average',
    description: 'Items priced slightly below comparable sold listings tend to move 2–3x faster without significantly impacting margin.',
    impact: 'Est. +30% sell-through rate',
    action: 'Decrease all prices by 5%',
  },
  {
    id: 'example-2',
    type: 'seo',
    title: 'Add Item Specifics to Listings',
    description: 'Listings missing brand, condition, or size in item specifics are filtered out of many buyer searches.',
    impact: '+15% search visibility',
    action: 'Review titles and item specifics for low-engagement listings',
  },
  {
    id: 'example-3',
    type: 'inventory',
    title: 'Enable Best Offer on Stale Items',
    description: 'Listings older than 60 days with no activity benefit from Best Offer to capture motivated buyers.',
    impact: 'Clear stagnant stock faster',
    action: 'Enable offers on stale inventory with 20% auto-accept',
  },
];

function derivesuggestions(listings: Listing[]): Suggestion[] {
  const suggestions: Suggestion[] = [];

  const getDaysActive = (startTime: string | null) => {
    if (!startTime) return 0;
    return Math.floor((Date.now() - new Date(startTime).getTime()) / 86400000);
  };

  // High watch count but no bids → price may be too high
  const highWatchNoBid = listings.filter(l => Number(l.watchCount) >= 5 && Number(l.bids) === 0);
  if (highWatchNoBid.length > 0) {
    const totalWatchers = highWatchNoBid.reduce((s, l) => s + Number(l.watchCount), 0);
    const estValue = highWatchNoBid.reduce((s, l) => s + parseFloat(String(l.price)), 0);
    suggestions.push({
      id: 'pricing-1',
      type: 'pricing',
      title: 'Price Optimization Opportunity',
      description: `${highWatchNoBid.length} listing${highWatchNoBid.length > 1 ? 's have' : ' has'} ${totalWatchers} total watchers but no bids yet — price may be slightly high.`,
      impact: 'Est. +$' + Math.round(estValue * 0.1) + '/mo revenue',
      action: `Decrease price of high-watch/no-bid items by 5%`,
    });
  }

  // Stale listings (>90 days)
  const stale = listings.filter(l => getDaysActive(l.startTime) > 90);
  if (stale.length > 0) {
    const staleValue = stale.reduce((s, l) => s + parseFloat(String(l.price)), 0);
    suggestions.push({
      id: 'inventory-1',
      type: 'inventory',
      title: 'Stale Inventory Alert',
      description: `${stale.length} item${stale.length > 1 ? 's have' : ' has'} been listed for >90 days without selling.`,
      impact: `Clear $${Math.round(staleValue)} in stagnant stock`,
      action: `Enable offers on stale inventory with 20% auto-accept`,
    });
  }

  // Low-engagement listings
  const lowEngagement = listings.filter(l => Number(l.watchCount) < 2 && Number(l.bids) === 0 && getDaysActive(l.startTime) > 14);
  if (lowEngagement.length > 0) {
    suggestions.push({
      id: 'seo-1',
      type: 'seo',
      title: 'Low Visibility Listings',
      description: `${lowEngagement.length} listing${lowEngagement.length > 1 ? 's have' : ' has'} fewer than 2 watchers after 14+ days. Title or item specifics may need work.`,
      impact: '+15% search visibility',
      action: `Review titles and item specifics for low-engagement listings`,
    });
  }

  return suggestions;
}

export function SmartSuggestions({ onApply }: SmartSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/active-listings')
      .then(r => r.json())
      .then((data: { items?: Listing[]; success?: boolean } | Listing[]) => {
        const listings: Listing[] = Array.isArray(data) ? data : (data.items ?? []);
        const derived = derivesuggestions(listings);
        setSuggestions(derived.length > 0 ? derived : EXAMPLE_SUGGESTIONS);
        setLoading(false);
      })
      .catch(() => {
        setSuggestions(EXAMPLE_SUGGESTIONS);
        setLoading(false);
      });
  }, []);

  return (
    <div className="glass-panel rounded-xl p-6 border border-white/5">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-5 h-5 text-amber-400" />
        <h3 className="text-lg font-semibold text-white">Smart Suggestions</h3>
      </div>

      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="p-4 rounded-lg bg-white/5 border border-white/5 animate-pulse">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-4 w-16 bg-white/10 rounded" />
                <div className="h-3 w-24 bg-white/5 rounded ml-auto" />
              </div>
              <div className="h-4 w-3/4 bg-white/8 rounded mb-2" />
              <div className="h-3 w-full bg-white/5 rounded mb-1" />
              <div className="h-3 w-2/3 bg-white/5 rounded mb-3" />
              <div className="h-3 w-40 bg-blue-500/10 rounded" />
            </div>
          ))}
        </div>
      )}

      <div className="space-y-4">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className="group p-4 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn(
                    "text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border",
                    suggestion.type === 'pricing' && "text-emerald-400 border-emerald-400/20 bg-emerald-400/10",
                    suggestion.type === 'seo' && "text-blue-400 border-blue-400/20 bg-blue-400/10",
                    suggestion.type === 'inventory' && "text-purple-400 border-purple-400/20 bg-purple-400/10",
                  )}>
                    {suggestion.type}
                  </span>
                  <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {suggestion.impact}
                  </span>
                </div>
                <h4 className="text-sm font-medium text-white mb-1">{suggestion.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                  {suggestion.description}
                </p>
                <button
                  onClick={() => onApply(suggestion.action)}
                  className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                >
                  Apply: "{suggestion.action}"
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
