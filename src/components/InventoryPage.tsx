import React, { useState, useEffect } from 'react';
import { Package, RefreshCw, Loader2, AlertCircle, ExternalLink, Plus, Image as ImageIcon, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActiveListing {
  itemId: string;
  title: string;
  price: string;
  watchCount: string | number;
  bids: string | number;
  startTime: string | null;
  imageUrl?: string;
  listingUrl: string;
}

interface InventoryPageProps {
  onAddToCommand?: (text: string) => void;
  onStartCrosslist?: (items: any[]) => void;
}

export function InventoryPage({ onAddToCommand, onStartCrosslist }: InventoryPageProps) {
  const [listings, setListings] = useState<ActiveListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalEntries, setTotalEntries] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchListings = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch('/api/active-listings');
      const d = await r.json();
      if (d.success) {
        setListings(d.items || []);
        setTotalEntries(d.totalEntries || d.items?.length || 0);
        setLoaded(true);
      } else {
        setError(d.error || 'Failed to load listings');
      }
    } catch (err: any) {
      setError(`Connection error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const getDaysActive = (startTime: string | null) => {
    if (!startTime) return null;
    return Math.floor((Date.now() - new Date(startTime).getTime()) / 86400000);
  };

  const isStale = (item: ActiveListing) => {
    const days = getDaysActive(item.startTime);
    return days !== null && days > 30;
  };

  const isWeak = (item: ActiveListing) => {
    return Number(item.watchCount) < 2;
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Package className="w-6 h-6 text-blue-400" />
            Active Inventory
          </h2>
          {loaded && (
            <p className="text-sm text-slate-400 mt-1">{totalEntries} listings on eBay</p>
          )}
        </div>
        <button
          onClick={fetchListings}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {loaded ? 'Refresh' : 'Pull from eBay'}
        </button>
      </div>

      {/* Summary Cards */}
      {loaded && listings.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="glass-panel p-4 rounded-xl border border-white/5">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Listings</p>
            <p className="text-2xl font-black text-white">{listings.length}</p>
          </div>
          <div className="glass-panel p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
            <p className="text-xs text-amber-400 uppercase tracking-wider mb-1">Weak Engagement</p>
            <p className="text-2xl font-black text-amber-400">{listings.filter(isWeak).length}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Watchers &lt; 2</p>
          </div>
          <div className="glass-panel p-4 rounded-xl border border-red-500/20 bg-red-500/5">
            <p className="text-xs text-red-400 uppercase tracking-wider mb-1">Stale (&gt;30d)</p>
            <p className="text-2xl font-black text-red-400">{listings.filter(isStale).length}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Listed over 30 days</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && !loaded && (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
        </div>
      )}

      {/* Empty State */}
      {!loading && loaded && listings.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-slate-500">
          <Package className="w-12 h-12 mb-4 opacity-20" />
          <p>No active listings found on eBay</p>
        </div>
      )}

      {/* Initial State */}
      {!loading && !loaded && !error && (
        <div className="flex flex-col items-center justify-center h-64 text-slate-500">
          <Package className="w-12 h-12 mb-4 opacity-20" />
          <p className="text-sm mb-4">Pull your active listings from eBay</p>
          <button
            onClick={fetchListings}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-all"
          >
            <RefreshCw className="w-4 h-4" /> Pull from eBay
          </button>
        </div>
      )}

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && onStartCrosslist && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 glass-panel rounded-xl px-6 py-4 border border-white/5 flex items-center gap-4 shadow-lg">
          <span className="text-sm text-slate-300">{selectedIds.size} selected</span>
          <button
            onClick={() => {
              const selected = listings.filter(item => selectedIds.has(item.itemId));
              onStartCrosslist(selected);
            }}
            className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Crosslist to Poshmark
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      {/* Listing Rows */}
      {loaded && listings.length > 0 && (
        <div className="space-y-3">
          {listings.map(item => {
            const days = getDaysActive(item.startTime);
            const stale = isStale(item);
            const weak = isWeak(item);

            return (
              <div
                key={item.itemId}
                className={cn(
                  "flex gap-4 p-4 glass-panel rounded-xl border transition-all hover:border-white/10",
                  stale ? "border-red-500/20 bg-red-500/5" : weak ? "border-amber-500/20 bg-amber-500/5" : "border-white/5"
                )}
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={selectedIds.has(item.itemId)}
                  onChange={(e) => {
                    const next = new Set(selectedIds);
                    e.target.checked ? next.add(item.itemId) : next.delete(item.itemId);
                    setSelectedIds(next);
                  }}
                  className="w-5 h-5 rounded border-white/20 bg-slate-900/50 cursor-pointer shrink-0 mt-1"
                />

                {/* Thumbnail */}
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt="" className="w-20 h-20 rounded-lg object-cover shrink-0 bg-white/5" />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                    <ImageIcon className="w-7 h-7 text-slate-600" />
                  </div>
                )}

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white leading-snug line-clamp-2">{item.title}</p>
                  <p className="text-xs text-slate-500 mt-1">ID: {item.itemId}</p>

                  <div className="flex flex-wrap gap-3 mt-2">
                    <span className="text-sm font-bold text-blue-400">${item.price}</span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <span className={cn("font-bold", weak ? "text-amber-400" : "text-white")}>{item.watchCount}</span> watchers
                    </span>
                    {Number(item.bids) > 0 && (
                      <span className="text-xs text-emerald-400 font-bold">{item.bids} bids</span>
                    )}
                    {days !== null && (
                      <span className={cn("text-xs font-medium", stale ? "text-red-400" : "text-slate-400")}>
                        {days}d active
                      </span>
                    )}
                  </div>

                  {/* Flags */}
                  <div className="flex gap-2 mt-2">
                    {weak && (
                      <span className="text-[10px] px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full">
                        Low Engagement
                      </span>
                    )}
                    {stale && (
                      <span className="text-[10px] px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full">
                        Stale
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 shrink-0">
                  <a
                    href={item.listingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white rounded-lg transition-colors"
                    title="View on eBay"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  {onAddToCommand && (
                    <button
                      onClick={() => onAddToCommand(`Update listing ${item.itemId} price to `)}
                      className="p-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 hover:text-white rounded-lg transition-colors"
                      title="Update price via command"
                    >
                      <TrendingUp className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
