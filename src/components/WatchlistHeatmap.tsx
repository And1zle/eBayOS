import React, { useEffect, useState } from 'react';
import { Eye, Flame, Clock, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Listing {
  itemId: string;
  title: string;
  price: string | number;
  watchCount: string | number;
  bids: string | number;
  startTime: string | null;
}

const getWatch = (l: Listing) => Number(l.watchCount) || 0;
const getDays = (t: string | null) => t ? Math.floor((Date.now() - new Date(t).getTime()) / 86400000) : 0;
const shortTitle = (t: string) => t.replace(/FREE\s*SHIP.*/i, '').trim();

function heatColor(ratio: number): { text: string; bg: string; bar: string } {
  if (ratio >= 0.8) return { text: 'text-orange-400', bg: 'bg-orange-500/20', bar: 'from-orange-500 to-red-500' };
  if (ratio >= 0.5) return { text: 'text-amber-400', bg: 'bg-amber-500/15', bar: 'from-amber-500 to-orange-500' };
  if (ratio >= 0.25) return { text: 'text-yellow-400', bg: 'bg-yellow-500/10', bar: 'from-yellow-600 to-amber-500' };
  return { text: 'text-slate-400', bg: 'bg-slate-500/10', bar: 'from-slate-600 to-slate-500' };
}

export function WatchlistHeatmap() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/active-listings')
      .then(r => r.json())
      .then((data: { items?: Listing[]; success?: boolean } | Listing[]) => {
        const items: Listing[] = Array.isArray(data) ? data : (data.items ?? []);
        // Sort by watch count descending, take top 8
        const sorted = [...items].sort((a, b) => getWatch(b) - getWatch(a)).slice(0, 8);
        setListings(sorted);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const maxWatch = listings.length > 0 ? Math.max(...listings.map(getWatch), 1) : 1;

  return (
    <div className="glass-panel rounded-xl p-6 border border-white/5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Eye className="w-5 h-5 text-orange-400" />
        <h3 className="text-lg font-semibold text-white">Watchlist Heatmap</h3>
        <span className="ml-auto text-[10px] font-mono text-slate-600 uppercase tracking-wider">Top 8 by watchers</span>
      </div>

      {/* Skeleton Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="animate-pulse flex items-center gap-3">
              <div className="h-8 flex-1 bg-white/5 rounded-lg" />
              <div className="h-4 w-10 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && listings.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-slate-500">
          <Eye className="w-8 h-8 mb-2 opacity-20" />
          <p className="text-sm">No watcher activity yet</p>
        </div>
      )}

      {/* Heatmap Rows */}
      {!loading && listings.length > 0 && (
        <div className="space-y-2">
          {listings.map((listing, idx) => {
            const watchCount = getWatch(listing);
            const ratio = watchCount / maxWatch;
            const heat = heatColor(ratio);
            const days = getDays(listing.startTime);
            const bids = Number(listing.bids) || 0;
            const title = shortTitle(listing.title);
            const price = parseFloat(String(listing.price)) || 0;

            return (
              <div
                key={listing.itemId}
                className="group relative rounded-lg p-3 hover:bg-white/5 transition-all"
              >
                {/* Heat bar background */}
                <div className="absolute inset-0 rounded-lg overflow-hidden">
                  <div
                    className={cn('absolute left-0 top-0 bottom-0 bg-gradient-to-r opacity-[0.07] group-hover:opacity-[0.12] transition-opacity', heat.bar)}
                    style={{ width: `${Math.max(ratio * 100, 5)}%` }}
                  />
                </div>

                <div className="relative flex items-center gap-3">
                  {/* Rank */}
                  <span className={cn(
                    'text-xs font-bold w-5 text-center shrink-0',
                    idx === 0 ? 'text-orange-400' : idx <= 2 ? 'text-amber-400/70' : 'text-slate-600'
                  )}>
                    {idx + 1}
                  </span>

                  {/* Heat indicator dot */}
                  <div className={cn('w-2 h-2 rounded-full shrink-0',
                    ratio >= 0.8 ? 'bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.6)]' :
                    ratio >= 0.5 ? 'bg-amber-500 shadow-[0_0_4px_rgba(245,158,11,0.4)]' :
                    ratio >= 0.25 ? 'bg-yellow-600' : 'bg-slate-600'
                  )} />

                  {/* Title + Price */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-300 truncate" title={listing.title}>
                      {title.length > 42 ? title.substring(0, 42) + '...' : title}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">${price.toFixed(2)}</p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-3 shrink-0">
                    {bids > 0 && (
                      <span className="flex items-center gap-1 text-[10px] text-violet-400">
                        <ShoppingCart className="w-3 h-3" />
                        {bids}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-[10px] text-slate-500">
                      <Clock className="w-3 h-3" />
                      {days}d
                    </span>
                    <span className={cn(
                      'flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border',
                      heat.text, heat.bg,
                      ratio >= 0.8 ? 'border-orange-500/30' :
                      ratio >= 0.5 ? 'border-amber-500/20' :
                      ratio >= 0.25 ? 'border-yellow-500/20' : 'border-slate-500/20'
                    )}>
                      <Eye className="w-3 h-3" />
                      {watchCount}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      {!loading && listings.length > 0 && (
        <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2">
          <Flame className="w-3 h-3 text-slate-600" />
          <span className="text-[10px] font-mono text-slate-600">
            Ranked by total watchers · 24h delta coming soon
          </span>
        </div>
      )}
    </div>
  );
}
