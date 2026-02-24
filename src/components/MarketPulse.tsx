import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Listing {
  itemId: string;
  title: string;
  price: string | number;
  watchCount: string | number;
  bids: string | number;
  startTime: string | null;
  imageUrl?: string;
}

type TabId = 'liquidity' | 'market-io' | 'drift' | 'telemetry';

const TABS: { key: string; label: string; id: TabId }[] = [
  { key: 'Alt+1', label: 'Liquidity',  id: 'liquidity'  },
  { key: 'Alt+2', label: 'Market I/O', id: 'market-io'  },
  { key: 'Alt+3', label: 'Drift',      id: 'drift'       },
  { key: 'Alt+4', label: 'Telemetry',  id: 'telemetry'   },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getDays   = (t: string | null) => t ? Math.floor((Date.now() - new Date(t).getTime()) / 86400000) : 0;
const getPrice  = (l: Listing)       => parseFloat(String(l.price));
const getWatch  = (l: Listing)       => Number(l.watchCount);
const shortTitle = (t: string)       => t.replace(/FREE\s*SHIP.*/i, '').trim();

const TOOLTIP_STYLE = {
  contentStyle: { backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' },
  itemStyle: { fontSize: '11px' },
  labelStyle: { color: '#94a3b8', fontSize: '11px', marginBottom: '2px' },
};

// ─── F1: Liquidity (Capital Aging) ───────────────────────────────────────────

function LiquidityPanel({ listings }: { listings: Listing[] }) {
  const liquid  = listings.filter(l => getDays(l.startTime) <= 30);
  const slowing = listings.filter(l => getDays(l.startTime) > 30 && getDays(l.startTime) <= 90);
  const trapped = listings.filter(l => getDays(l.startTime) > 90);

  const liquidVal  = liquid.reduce ((s, l) => s + getPrice(l), 0);
  const slowingVal = slowing.reduce((s, l) => s + getPrice(l), 0);
  const trappedVal = trapped.reduce((s, l) => s + getPrice(l), 0);
  const totalVal   = liquidVal + slowingVal + trappedVal;

  const buckets = [
    { label: '0–30d',  sub: 'Liquid',  count: liquid.length,  val: liquidVal,  bar: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/20' },
    { label: '30–90d', sub: 'Slowing', count: slowing.length, val: slowingVal, bar: 'bg-amber-500',   text: 'text-amber-400',   border: 'border-amber-500/20'   },
    { label: '90d+',   sub: 'Trapped', count: trapped.length, val: trappedVal, bar: 'bg-red-500',     text: 'text-red-400',     border: 'border-red-500/20'     },
  ];

  return (
    <div className="space-y-6 flex flex-col h-full">
      {/* Stacked progress bar */}
      <div className="flex h-4 rounded-full overflow-hidden gap-1">
        {buckets.map(b => (
          <div
            key={b.label}
            className={cn(b.bar, 'transition-all')}
            style={{ width: `${totalVal > 0 ? (b.val / totalVal) * 100 : 33.3}%` }}
            title={`${b.label}: $${Math.round(b.val).toLocaleString()}`}
          />
        ))}
      </div>

      {/* Bucket cards */}
      <div className="grid grid-cols-3 gap-4">
        {buckets.map(b => (
          <div key={b.label} className={cn('p-6 rounded-lg bg-white/5 border', b.border)}>
            <div className={cn('text-[10px] font-mono uppercase tracking-wider mb-2', b.text)}>
              {b.label} · {b.sub}
            </div>
            <div className="text-3xl font-black text-white mb-2">${Math.round(b.val).toLocaleString()}</div>
            <div className="text-sm text-slate-500">{b.count} item{b.count !== 1 ? 's' : ''}</div>
          </div>
        ))}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="text-sm text-slate-500 mb-2">Total capital deployed</div>
          <div className="text-5xl font-black text-white">${Math.round(totalVal).toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}

// ─── F2: Market I/O (Price Distribution) ─────────────────────────────────────

function MarketIOPanel({ listings }: { listings: Listing[] }) {
  const totalVal     = listings.reduce((s, l) => s + getPrice(l), 0);
  const totalWatch   = listings.reduce((s, l) => s + getWatch(l), 0);
  const avgWatch     = listings.length > 0 ? (totalWatch / listings.length).toFixed(1) : '0';

  const buckets = [
    { name: '$0–25',    min: 0,   max: 25,       count: 0 },
    { name: '$25–50',   min: 25,  max: 50,        count: 0 },
    { name: '$50–100',  min: 50,  max: 100,       count: 0 },
    { name: '$100–250', min: 100, max: 250,       count: 0 },
    { name: '$250+',    min: 250, max: Infinity,  count: 0 },
  ];
  for (const l of listings) {
    const p = getPrice(l);
    const b = buckets.find(b => p >= b.min && p < b.max);
    if (b) b.count++;
  }

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="grid grid-cols-2 gap-4">
        <div className="p-6 rounded-lg bg-white/5 border border-white/5">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">Total Listed Value</div>
          <div className="text-4xl font-black text-white mb-2">${Math.round(totalVal).toLocaleString()}</div>
          <div className="text-sm text-slate-500">{listings.length} listings</div>
        </div>
        <div className="p-6 rounded-lg bg-white/5 border border-white/5">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">Avg. Watchers</div>
          <div className={cn('text-4xl font-black mb-2', parseFloat(avgWatch) >= 3 ? 'text-emerald-400' : 'text-amber-400')}>
            {avgWatch}
          </div>
          <div className="text-sm text-slate-500">per listing</div>
        </div>
      </div>

      <div className="flex-1 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={buckets} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
            <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [v, 'listings']} />
            <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── F3: Drift (Watcher Concentration) ───────────────────────────────────────

function DriftPanel({ listings }: { listings: Listing[] }) {
  const tiers = [
    { name: '$0–25',    min: 0,   max: 25      },
    { name: '$25–50',   min: 25,  max: 50      },
    { name: '$50–100',  min: 50,  max: 100     },
    { name: '$100–250', min: 100, max: 250     },
    { name: '$250+',    min: 250, max: Infinity },
  ];

  const tierData = tiers.map(t => {
    const group = listings.filter(l => getPrice(l) >= t.min && getPrice(l) < t.max);
    const avgWatch = group.length > 0
      ? parseFloat((group.reduce((s, l) => s + getWatch(l), 0) / group.length).toFixed(1))
      : 0;
    return { name: t.name, avgWatch, count: group.length };
  }).filter(t => t.count > 0);

  const topWatched = [...listings].sort((a, b) => getWatch(b) - getWatch(a)).slice(0, 3);

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="text-[10px] text-slate-500 uppercase tracking-wider">Avg Watchers by Price Tier</div>

      <div className="flex-1 min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={tierData} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
            <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [v, 'avg watchers']} />
            <Bar dataKey="avgWatch" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-3 border-t border-white/10 pt-6">
        <div className="text-[10px] text-slate-500 uppercase tracking-wider">Top Watched</div>
        {topWatched.map(l => (
          <div key={l.itemId} className="flex items-center gap-3 py-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-sm text-slate-300 truncate flex-1">{shortTitle(l.title)}</span>
            <span className="text-xs font-mono text-emerald-400 shrink-0">{getWatch(l)} 👁</span>
            <span className="text-xs font-mono text-slate-500 shrink-0">${getPrice(l)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── F4: Telemetry (Watch Pressure) ──────────────────────────────────────────

function TelemetryPanel({ listings }: { listings: Listing[] }) {
  const watchPressure = listings.reduce((s, l) => s + getPrice(l) * getWatch(l), 0);
  const totalWatch    = listings.reduce((s, l) => s + getWatch(l), 0);
  const bidItems      = listings.filter(l => Number(l.bids) > 0);
  const bidValue      = bidItems.reduce((s, l) => s + getPrice(l), 0);

  const topPressure = [...listings]
    .sort((a, b) => getPrice(b) * getWatch(b) - getPrice(a) * getWatch(a))
    .slice(0, 4);

  const maxPressure = topPressure[0] ? getPrice(topPressure[0]) * getWatch(topPressure[0]) : 1;

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="grid grid-cols-2 gap-4">
        <div className="p-6 rounded-lg bg-white/5 border border-blue-500/20">
          <div className="text-[10px] text-blue-400 uppercase tracking-wider mb-3">Watch Pressure</div>
          <div className="text-4xl font-black text-blue-400 mb-2">${Math.round(watchPressure).toLocaleString()}</div>
          <div className="text-sm text-slate-500">{totalWatch} watchers × price</div>
        </div>
        <div className={cn('p-6 rounded-lg bg-white/5 border', bidItems.length > 0 ? 'border-emerald-500/20' : 'border-white/5')}>
          <div className={cn('text-[10px] uppercase tracking-wider mb-3', bidItems.length > 0 ? 'text-emerald-400' : 'text-slate-500')}>
            Active Bids
          </div>
          <div className={cn('text-4xl font-black mb-2', bidItems.length > 0 ? 'text-emerald-400' : 'text-slate-600')}>
            {bidItems.length > 0 ? `$${Math.round(bidValue).toLocaleString()}` : '—'}
          </div>
          <div className="text-sm text-slate-500">{bidItems.length} item{bidItems.length !== 1 ? 's' : ''} w/ bids</div>
        </div>
      </div>

      <div className="flex-1 space-y-4 border-t border-white/10 pt-6 overflow-y-auto">
        <div className="text-[10px] text-slate-500 uppercase tracking-wider">Pressure Index</div>
        {topPressure.map(l => {
          const p = Math.round(getPrice(l) * getWatch(l));
          const pct = maxPressure > 0 ? (p / maxPressure) * 100 : 0;
          return (
            <div key={l.itemId} className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-300 truncate flex-1">{shortTitle(l.title)}</span>
                <span className="text-sm font-mono text-blue-400 shrink-0">${p.toLocaleString()}</span>
              </div>
              <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full bg-blue-500/60 rounded-full" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function MarketPulse() {
  const [activeTab, setActiveTab] = useState<TabId>('market-io');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/active-listings')
      .then(r => r.json())
      .then((data: { items?: Listing[]; success?: boolean } | Listing[]) => {
        const list: Listing[] = Array.isArray(data) ? data : (data.items ?? []);
        setListings(list);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Alt+1 through Alt+4 to hot-swap tabs
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.altKey) return;
      const map: Record<string, TabId> = {
        '1': 'liquidity',
        '2': 'market-io',
        '3': 'drift',
        '4': 'telemetry',
      };
      if (map[e.key]) {
        e.preventDefault();
        setActiveTab(map[e.key]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="glass-panel rounded-xl p-5 border border-white/5 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-400" />
          <h3 className="text-lg font-semibold text-white">Market Pulse</h3>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">
          {loading ? '…' : `${listings.length} listings · alt+1–4`}
        </span>
      </div>

      {/* F-Key Segmented Control */}
      <div className="flex gap-1.5 mb-5">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            title={`Alt+${tab.key.replace('F', '')}`}
            className={cn(
              'flex-1 flex flex-col items-center py-1.5 rounded-md border font-mono transition-all duration-150',
              activeTab === tab.id
                ? 'bg-blue-500/20 border-blue-500/50 text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.2)] scale-[1.02]'
                : 'bg-slate-900/60 border-white/8 text-slate-500 hover:text-slate-300 hover:bg-white/5 hover:border-white/15'
            )}
          >
            <span className="text-[8px] text-slate-600 leading-none mb-0.5">{tab.key}</span>
            <span className="text-[10px] leading-none">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Panel Content */}
      {loading ? (
        <div className="space-y-4 p-2 animate-pulse">
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-4 rounded-lg bg-white/5 border border-white/5">
                <div className="h-3 w-16 bg-white/8 rounded mb-2" />
                <div className="h-7 w-20 bg-white/10 rounded" />
              </div>
            ))}
          </div>
          <div className="h-48 bg-white/5 rounded-lg border border-white/5" />
        </div>
      ) : (
        <>
          {activeTab === 'liquidity'  && <LiquidityPanel  listings={listings} />}
          {activeTab === 'market-io'  && <MarketIOPanel   listings={listings} />}
          {activeTab === 'drift'      && <DriftPanel      listings={listings} />}
          {activeTab === 'telemetry'  && <TelemetryPanel  listings={listings} />}
        </>
      )}
    </div>
  );
}
