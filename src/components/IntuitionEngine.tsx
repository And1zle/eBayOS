import React, { useState, useEffect } from 'react';
import { Brain, ChevronDown, ChevronUp, Database, Tag, DollarSign, CheckCircle2, Award, LogOut, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface IntuitionStats {
  sellerProfileLoaded: boolean;
  sellerVoice: string | null;
  pricingRule: string | null;
  outcomeCount: number;
  categoriesCached: number;
  priceCacheSize: number;
}

export function IntuitionEngine() {
  const [isOpen, setIsOpen] = useState(true);
  const [stats, setStats] = useState<IntuitionStats>({
    sellerProfileLoaded: false,
    sellerVoice: 'Direct, honest, no marketing fluff — let the item speak for itself',
    pricingRule: '10% below median sold comps to move inventory fast',
    outcomeCount: 0,
    categoriesCached: 0,
    priceCacheSize: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/status')
      .then(r => r.json())
      .then(d => {
        if (d.intuition) {
          setStats({
            sellerProfileLoaded: d.intuition.sellerProfileLoaded ?? false,
            sellerVoice: d.intuition.sellerVoice || stats.sellerVoice,
            pricingRule: d.intuition.pricingRule || stats.pricingRule,
            outcomeCount: d.intuition.outcomeCount ?? 0,
            categoriesCached: d.intuition.categoriesCached ?? 0,
            priceCacheSize: d.intuition.priceCacheSize ?? 0,
          });
        }
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  return (
    <div className="glass-panel rounded-xl border border-white/5 overflow-hidden bg-[#0B0E14]/50">
      {/* User Profile Header */}
      <div className="p-4 flex items-center gap-3 border-b border-white/5 bg-white/[0.02]">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-900/20">
           <span className="font-bold text-white text-sm">eBay</span>
        </div>
        <div className="flex-1 min-w-0">
           <h4 className="text-sm font-bold text-white truncate">Seller Account</h4>
           <div className="flex items-center gap-1.5">
             <Award className="w-3 h-3 text-amber-400" />
             <span className="text-xs text-amber-400 font-medium">Power Seller</span>
           </div>
        </div>
        <button
          onClick={() => { setLoading(true); setError(false); fetch('/api/status').then(r=>r.json()).then(d=>{ if(d.intuition) setStats(s=>({...s,...d.intuition})); }).catch(()=>setError(true)).finally(()=>setLoading(false)); }}
          className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
          title="Refresh"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Intuition Toggle Bar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 px-4 hover:bg-white/5 transition-colors border-b border-white/5"
      >
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold text-indigo-300 tracking-wider uppercase">Intuition Engine</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-slate-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-500" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-4 space-y-4 bg-black/20">
              {/* Seller DNA Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Seller DNA</h4>
                  {loading ? (
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-400/10 px-1.5 py-0.5 rounded">SYNCING</span>
                  ) : error ? (
                    <span className="text-[10px] font-bold text-red-400 flex items-center gap-1 bg-red-400/10 px-1.5 py-0.5 rounded">
                      <AlertCircle className="w-3 h-3" /> OFFLINE
                    </span>
                  ) : (
                    <span className={cn(
                      "text-[10px] font-bold flex items-center gap-1 px-1.5 py-0.5 rounded",
                      stats.sellerProfileLoaded
                        ? "text-emerald-400 bg-emerald-400/10"
                        : "text-amber-400 bg-amber-400/10"
                    )}>
                      <CheckCircle2 className="w-3 h-3" />
                      {stats.sellerProfileLoaded ? 'ACTIVE' : 'NO PROFILE'}
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-slate-300">Voice</span>
                    <span className="text-xs text-slate-400 leading-relaxed pl-2 border-l-2 border-white/10">
                      {stats.sellerVoice || '—'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-slate-300">Pricing Strategy</span>
                    <span className="text-xs text-slate-400 leading-relaxed pl-2 border-l-2 border-white/10">
                      {stats.pricingRule || '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Live Stats Grid */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
                <div className="flex flex-col items-center justify-center p-2 rounded bg-white/5 border border-white/5 text-center">
                  <Database className="w-3 h-3 text-blue-400 mb-1" />
                  <span className="text-xs font-bold text-white">{loading ? '…' : stats.outcomeCount}</span>
                  <span className="text-[9px] text-slate-500 uppercase">Learned</span>
                </div>
                <div className="flex flex-col items-center justify-center p-2 rounded bg-white/5 border border-white/5 text-center">
                  <Tag className="w-3 h-3 text-amber-400 mb-1" />
                  <span className="text-xs font-bold text-white">{loading ? '…' : stats.categoriesCached}</span>
                  <span className="text-[9px] text-slate-500 uppercase">Cats</span>
                </div>
                <div className="flex flex-col items-center justify-center p-2 rounded bg-white/5 border border-white/5 text-center">
                  <DollarSign className="w-3 h-3 text-emerald-400 mb-1" />
                  <span className="text-xs font-bold text-white">{loading ? '…' : stats.priceCacheSize}</span>
                  <span className="text-[9px] text-slate-500 uppercase">Prices</span>
                </div>
              </div>

              {!loading && !error && (
                <p className="text-[9px] text-slate-600 text-center leading-relaxed">
                  Every AI prompt includes Seller DNA + live market data + eBay category requirements
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
