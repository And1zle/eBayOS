import React, { useState } from 'react';
import { Terminal, ChevronRight, ChevronDown, Zap, RefreshCw, Mail, Tag, DollarSign, XCircle, Copy, Send, Settings, Trash2, MessageSquare, BarChart3, FileText } from 'lucide-react';
import { Intent } from '@/types';
import { cn } from '@/lib/utils';

interface RightSidebarProps {
  onSelectExample: (text: string) => void;
}

interface CommandDef {
  intent: Intent;
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  example: string;
}

const CATEGORIES: { id: string; label: string; accent: string; commands: CommandDef[] }[] = [
  {
    id: 'inventory',
    label: 'Inventory',
    accent: 'text-blue-400',
    commands: [
      { intent: Intent.CREATE_LISTING,    label: 'CREATE_LISTING',    icon: Zap,      color: 'text-blue-400',   bg: 'bg-blue-400/10',   border: 'border-blue-400/20',   example: 'List a used Nike Air Jordan 11 size 10 for $185 with free shipping' },
      { intent: Intent.END_LISTING,       label: 'END_LISTING',       icon: XCircle,  color: 'text-red-400',    bg: 'bg-red-400/10',    border: 'border-red-400/20',    example: 'End listing 136645465618 — out of stock' },
      { intent: Intent.DUPLICATE_LISTING, label: 'DUPLICATE_LISTING', icon: Copy,     color: 'text-sky-400',    bg: 'bg-sky-400/10',    border: 'border-sky-400/20',    example: 'Duplicate listing 136645465618 with price $89' },
      { intent: Intent.BULK_END_LISTINGS, label: 'BULK_END_LISTINGS', icon: Trash2,   color: 'text-rose-400',   bg: 'bg-rose-400/10',   border: 'border-rose-400/20',   example: 'End all listings older than 90 days priced below $20' },
    ],
  },
  {
    id: 'pricing',
    label: 'Pricing',
    accent: 'text-emerald-400',
    commands: [
      { intent: Intent.UPDATE_PRICE,      label: 'UPDATE_PRICE',      icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', example: 'Update listing 136645465618 price to $99' },
      { intent: Intent.BULK_PRICE_ADJUST, label: 'BULK_PRICE_ADJUST', icon: RefreshCw,  color: 'text-amber-400',  bg: 'bg-amber-400/10',  border: 'border-amber-400/20',  example: 'Decrease all prices by 8%' },
    ],
  },
  {
    id: 'negotiation',
    label: 'Negotiation',
    accent: 'text-purple-400',
    commands: [
      { intent: Intent.ENABLE_OFFERS,            label: 'ENABLE_OFFERS',            icon: Tag,  color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20', example: 'Enable best offer on listing 136645465618 with auto-accept at $80' },
      { intent: Intent.SEND_OFFER_TO_WATCHERS,   label: 'SEND_OFFER_TO_WATCHERS',   icon: Send, color: 'text-violet-400', bg: 'bg-violet-400/10', border: 'border-violet-400/20', example: 'Send 15% off offer to watchers on listing 136887935931' },
      { intent: Intent.RESPOND_TO_BUYER,         label: 'RESPOND_TO_BUYER',         icon: Mail, color: 'text-pink-400',   bg: 'bg-pink-400/10',   border: 'border-pink-400/20',   example: 'Reply to buyer: I can accept $45, ships same day' },
    ],
  },
  {
    id: 'account',
    label: 'Account Controls',
    accent: 'text-amber-400',
    commands: [
      { intent: Intent.UPDATE_FULFILLMENT_SETTINGS, label: 'UPDATE_FULFILLMENT', icon: Settings, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20', example: 'Set vacation mode on with auto-reply: Away until March 1st, orders ship on return' },
    ],
  },
  {
    id: 'messages',
    label: 'Messages',
    accent: 'text-pink-400',
    commands: [
      { intent: Intent.RESPOND_TO_BUYER, label: 'RESPOND_TO_BUYER', icon: MessageSquare, color: 'text-pink-400', bg: 'bg-pink-400/10', border: 'border-pink-400/20', example: 'Reply to buyer: I can do $42 with combined shipping, deal!' },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    accent: 'text-violet-400',
    commands: [
      { intent: Intent.UNKNOWN, label: 'ANALYZE_PERFORMANCE', icon: BarChart3, color: 'text-violet-400', bg: 'bg-violet-400/10', border: 'border-violet-400/20', example: 'Show me my top performing listings by watchers' },
      { intent: Intent.UNKNOWN, label: 'EXPORT_REPORT', icon: FileText, color: 'text-violet-400', bg: 'bg-violet-400/10', border: 'border-violet-400/20', example: 'Export analytics report for my current inventory' },
    ],
  },
];

export function RightSidebar({ onSelectExample }: RightSidebarProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="w-72 border-l border-white/5 bg-[#0B0E14]/80 backdrop-blur-xl flex flex-col h-screen">
      {/* Header */}
      <div className="p-5 border-b border-white/5 flex items-center justify-between">
        <h2 className="font-bold text-white flex items-center gap-2 text-sm">
          <Terminal className="w-4 h-4 text-blue-400" />
          Command Library
        </h2>
        <span className="text-[9px] font-mono text-slate-600 uppercase tracking-wider">13 ops</span>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {CATEGORIES.map(cat => (
          <div key={cat.id}>
            <button
              onClick={() => toggle(cat.id)}
              className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
            >
              <span className={cn('text-[10px] font-bold uppercase tracking-widest', cat.accent)}>
                {cat.label}
              </span>
              <ChevronDown className={cn(
                'w-3 h-3 text-slate-600 transition-transform duration-150',
                collapsed[cat.id] ? '-rotate-90' : ''
              )} />
            </button>

            {!collapsed[cat.id] && (
              <div className="space-y-0.5 mb-2">
                {cat.commands.map(cmd => (
                  <button
                    key={cmd.intent}
                    onClick={() => onSelectExample(cmd.example)}
                    className="w-full flex items-center justify-between px-2 py-2 rounded-lg border border-transparent hover:border-white/8 hover:bg-white/5 transition-all duration-150 group text-left"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={cn('w-6 h-6 rounded-md flex items-center justify-center border shrink-0', cmd.bg, cmd.border)}>
                        <cmd.icon className={cn('w-3 h-3', cmd.color)} />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-400 group-hover:text-slate-200 transition-colors font-mono truncate">
                        {cmd.label}
                      </span>
                    </div>
                    <ChevronRight className="w-3 h-3 text-slate-700 group-hover:text-slate-400 shrink-0 ml-1" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        <div className="mt-3 p-3 rounded-xl bg-slate-900/60 border border-white/5">
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Natural language is compiled into commerce directives. Schema is validated before any API execution.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span className="font-mono">console.out</span>
          <button className="px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-400 text-xs transition-colors font-mono">
            View Log
          </button>
        </div>
      </div>
    </div>
  );
}
