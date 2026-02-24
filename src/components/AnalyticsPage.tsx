import React, { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3, Loader2, TrendingUp, Filter, Activity, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Listing {
  itemId: string;
  title: string;
  price: string | number;
  watchCount: string | number;
  bids: string | number;
  startTime: string | null;
  condition?: string;
}

type TabId = 'revenue' | 'funnel' | 'performance' | 'health';

const TABS: { key: string; label: string; id: TabId; icon: React.ElementType }[] = [
  { key: 'Alt+1', label: 'Revenue',     id: 'revenue',     icon: TrendingUp },
  { key: 'Alt+2', label: 'Funnel',      id: 'funnel',      icon: Filter },
  { key: 'Alt+3', label: 'Performance', id: 'performance', icon: Activity },
  { key: 'Alt+4', label: 'Health',      id: 'health',      icon: Heart },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getPrice = (l: Listing) => parseFloat(String(l.price));
const getWatch = (l: Listing) => Number(l.watchCount);
const getBids  = (l: Listing) => Number(l.bids);
const getDays  = (t: string | null) => t ? Math.floor((Date.now() - new Date(t).getTime()) / 86400000) : 0;
const shortTitle = (t: string) => t.replace(/FREE\s*SHIP.*/i, '').trim();

const TOOLTIP_STYLE = {
  contentStyle: { backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' },
  itemStyle: { fontSize: '11px' },
  labelStyle: { color: '#94a3b8', fontSize: '11px', marginBottom: '2px' },
};

// ─── Alt+1: Revenue ──────────────────────────────────────────────────────────

function RevenuePanel({ listings }: { listings: Listing[] }) {
  const totalVal   = listings.reduce((s, l) => s + getPrice(l), 0);
  const avgPrice   = listings.length > 0 ? totalVal / listings.length : 0;
  const totalWatch = listings.reduce((s, l) => s + getWatch(l), 0);
  const withBids   = listings.filter(l => getBids(l) > 0);

  // Group listings by month for trend chart
  const monthData: Record<string, { month: string; value: number; count: number }> = {};
  for (const l of listings) {
    if (!l.startTime) continue;
    const d = new Date(l.startTime);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    if (!monthData[key]) monthData[key] = { month: label, value: 0, count: 0 };
    monthData[key].value += getPrice(l);
    monthData[key].count++;
  }
  const trendData = Object.entries(monthData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v);

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="grid grid-cols-4 gap-3">
        <div className="p-5 rounded-lg bg-white/5 border border-white/5">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Total Listed Value</div>
          <div className="text-3xl font-black text-white">${Math.round(totalVal).toLocaleString()}</div>
        </div>
        <div className="p-5 rounded-lg bg-white/5 border border-white/5">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Avg Price</div>
          <div className="text-3xl font-black text-emerald-400">${avgPrice.toFixed(2)}</div>
        </div>
        <div className="p-5 rounded-lg bg-white/5 border border-white/5">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Total Watchers</div>
          <div className="text-3xl font-black text-blue-400">{totalWatch}</div>
        </div>
        <div className="p-5 rounded-lg bg-white/5 border border-blue-500/20">
          <div className="text-[10px] text-blue-400 uppercase tracking-wider mb-2">Items w/ Bids</div>
          <div className="text-3xl font-black text-blue-400">{withBids.length}</div>
        </div>
      </div>

      <div className="flex-1 min-h-[280px]">
        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">Listed Value by Month</div>
        <ResponsiveContainer width="100%" height="90%">
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
            <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
            <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [`$${Math.round(v).toLocaleString()}`, 'Value']} />
            <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Alt+2: Funnel ───────────────────────────────────────────────────────────

function FunnelPanel({ listings }: { listings: Listing[] }) {
  const total     = listings.length;
  const watched   = listings.filter(l => getWatch(l) > 0).length;
  const withBids  = listings.filter(l => getBids(l) > 0).length;

  const stages = [
    { label: 'Total Listed',  count: total,    pct: 100,                                   color: 'bg-blue-500',    text: 'text-blue-400',    border: 'border-blue-500/20' },
    { label: 'Has Watchers',  count: watched,  pct: total > 0 ? (watched / total) * 100 : 0,  color: 'bg-amber-500',   text: 'text-amber-400',   border: 'border-amber-500/20' },
    { label: 'Has Bids',      count: withBids, pct: total > 0 ? (withBids / total) * 100 : 0, color: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  ];

  return (
    <div className="space-y-6 flex flex-col h-full">
      {/* Stage Cards */}
      <div className="grid grid-cols-3 gap-4">
        {stages.map(s => (
          <div key={s.label} className={cn('p-6 rounded-lg bg-white/5 border', s.border)}>
            <div className={cn('text-[10px] uppercase tracking-wider mb-2', s.text)}>{s.label}</div>
            <div className="text-4xl font-black text-white mb-1">{s.count}</div>
            <div className="text-sm text-slate-500">{s.pct.toFixed(1)}% of listed</div>
          </div>
        ))}
      </div>

      {/* Funnel Bars */}
      <div className="flex-1 space-y-6">
        <div className="text-[10px] text-slate-500 uppercase tracking-wider">Conversion Funnel</div>
        {stages.map((s, i) => (
          <div key={s.label} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className={cn('text-sm font-semibold', s.text)}>{s.label}</span>
              <span className="text-sm font-mono text-white">{s.count} ({s.pct.toFixed(1)}%)</span>
            </div>
            <div className="h-6 rounded-full bg-white/5 overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', s.color)}
                style={{ width: `${s.pct}%` }}
              />
            </div>
            {i < stages.length - 1 && (
              <div className="text-[10px] text-slate-600 text-center">
                ↓ {((stages[i + 1].count / Math.max(s.count, 1)) * 100).toFixed(1)}% conversion
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Alt+3: Performance ──────────────────────────────────────────────────────

function PerformancePanel({ listings }: { listings: Listing[] }) {
  const sorted = [...listings].sort((a, b) => getWatch(b) - getWatch(a));
  const top5 = sorted.slice(0, 5);
  const bottom5 = sorted.slice(-5).reverse();

  const renderRow = (l: Listing, rank: number, type: 'top' | 'bottom') => (
    <div
      key={l.itemId}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border',
        type === 'top' ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-red-500/5 border-red-500/10'
      )}
    >
      <span className={cn(
        'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0',
        type === 'top' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
      )}>
        {rank}
      </span>
      <span className="text-sm text-slate-300 truncate flex-1">{shortTitle(l.title)}</span>
      <span className="text-xs font-mono text-slate-400 shrink-0">${getPrice(l)}</span>
      <span className={cn(
        'text-xs font-mono shrink-0',
        type === 'top' ? 'text-emerald-400' : 'text-red-400'
      )}>
        {getWatch(l)} 👁
      </span>
      <span className="text-xs font-mono text-slate-600 shrink-0">{getDays(l.startTime)}d</span>
    </div>
  );

  return (
    <div className="space-y-6 flex flex-col h-full overflow-y-auto">
      {/* Top Performers */}
      <div className="space-y-2">
        <div className="text-[10px] text-emerald-400 uppercase tracking-wider">Top 5 — Most Watched</div>
        {top5.map((l, i) => renderRow(l, i + 1, 'top'))}
      </div>

      <div className="border-t border-white/10" />

      {/* Bottom Performers */}
      <div className="space-y-2">
        <div className="text-[10px] text-red-400 uppercase tracking-wider">Bottom 5 — Least Watched</div>
        {bottom5.map((l, i) => renderRow(l, i + 1, 'bottom'))}
      </div>
    </div>
  );
}

// ─── Alt+4: Health ───────────────────────────────────────────────────────────

function HealthPanel({ listings }: { listings: Listing[] }) {
  const avgDays = listings.length > 0
    ? listings.reduce((s, l) => s + getDays(l.startTime), 0) / listings.length
    : 0;

  const sortedByPrice = [...listings].sort((a, b) => getPrice(b) - getPrice(a));
  const top10Value = sortedByPrice.slice(0, 10).reduce((s, l) => s + getPrice(l), 0);
  const totalValue = listings.reduce((s, l) => s + getPrice(l), 0);
  const concentration = totalValue > 0 ? (top10Value / totalValue) * 100 : 0;

  const totalWatch = listings.reduce((s, l) => s + getWatch(l), 0);
  const efficiency = listings.length > 0 ? (totalWatch / listings.length).toFixed(1) : '0';

  // Condition breakdown
  const conditions: Record<string, number> = {};
  for (const l of listings) {
    const cond = (l.condition || 'unknown').toLowerCase();
    conditions[cond] = (conditions[cond] || 0) + 1;
  }
  const condData = Object.entries(conditions).map(([name, count]) => ({ name, count }));

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="grid grid-cols-3 gap-4">
        <div className="p-6 rounded-lg bg-white/5 border border-white/5">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Avg Days Listed</div>
          <div className={cn(
            'text-4xl font-black',
            avgDays <= 30 ? 'text-emerald-400' : avgDays <= 90 ? 'text-amber-400' : 'text-red-400'
          )}>
            {Math.round(avgDays)}
          </div>
          <div className="text-sm text-slate-500">days avg</div>
        </div>
        <div className="p-6 rounded-lg bg-white/5 border border-white/5">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Top 10 Concentration</div>
          <div className={cn(
            'text-4xl font-black',
            concentration < 50 ? 'text-emerald-400' : concentration < 75 ? 'text-amber-400' : 'text-red-400'
          )}>
            {concentration.toFixed(0)}%
          </div>
          <div className="text-sm text-slate-500">of total value</div>
        </div>
        <div className="p-6 rounded-lg bg-white/5 border border-white/5">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Watcher Efficiency</div>
          <div className={cn(
            'text-4xl font-black',
            parseFloat(efficiency) >= 3 ? 'text-emerald-400' : parseFloat(efficiency) >= 1 ? 'text-amber-400' : 'text-red-400'
          )}>
            {efficiency}
          </div>
          <div className="text-sm text-slate-500">watchers/listing</div>
        </div>
      </div>

      <div className="flex-1 min-h-[250px]">
        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">Condition Breakdown</div>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={condData} barSize={32}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
            <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [v, 'listings']} />
            <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('revenue');
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
      const map: Record<string, TabId> = { '1': 'revenue', '2': 'funnel', '3': 'performance', '4': 'health' };
      if (map[e.key]) { e.preventDefault(); setActiveTab(map[e.key]); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="glass-panel rounded-xl p-5 border border-white/5 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-violet-400" />
          <h3 className="text-lg font-semibold text-white">Analytics</h3>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">
          {loading ? '...' : `${listings.length} listings · alt+1-4`}
        </span>
      </div>

      {/* Tab Segmented Control */}
      <div className="flex gap-1.5 mb-5">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            title={tab.key}
            className={cn(
              'flex-1 flex flex-col items-center py-1.5 rounded-md border font-mono transition-all duration-150',
              activeTab === tab.id
                ? 'bg-violet-500/20 border-violet-500/50 text-violet-300 shadow-[0_0_10px_rgba(139,92,246,0.2)] scale-[1.02]'
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
        <div className="flex items-center gap-2 text-slate-400 text-sm py-6 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading analytics...
        </div>
      ) : (
        <>
          {activeTab === 'revenue'     && <RevenuePanel     listings={listings} />}
          {activeTab === 'funnel'      && <FunnelPanel      listings={listings} />}
          {activeTab === 'performance' && <PerformancePanel listings={listings} />}
          {activeTab === 'health'      && <HealthPanel      listings={listings} />}
        </>
      )}
    </div>
  );
}
