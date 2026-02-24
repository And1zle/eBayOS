import React from 'react';
import { Zap, TrendingDown, TrendingUp, Send, Trash2, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickActionsProps {
  onApply: (action: string) => void;
}

const ACTIONS = [
  {
    label: 'Drop All 5%',
    description: 'Decrease all listing prices by 5%',
    command: 'Decrease all prices by 5%',
    icon: Zap,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    hoverGlow: 'hover:shadow-emerald-500/10',
  },
  {
    label: 'Drop All 10%',
    description: 'Aggressive price cut across inventory',
    command: 'Decrease all prices by 10%',
    icon: TrendingDown,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    hoverGlow: 'hover:shadow-amber-500/10',
  },
  {
    label: 'Offer to Watchers',
    description: 'Send offers to all item watchers',
    command: 'Send offer to watchers on all listings',
    icon: Send,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    hoverGlow: 'hover:shadow-blue-500/10',
  },
  {
    label: 'End Stale Items',
    description: 'End listings older than 90 days',
    command: 'End all listings older than 90 days',
    icon: Trash2,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    hoverGlow: 'hover:shadow-red-500/10',
  },
  {
    label: 'Enable Best Offer',
    description: 'Turn on offers for all listings',
    command: 'Enable offers on all listings',
    icon: Heart,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    hoverGlow: 'hover:shadow-purple-500/10',
  },
  {
    label: 'Raise All 5%',
    description: 'Increase all listing prices by 5%',
    command: 'Increase all prices by 5%',
    icon: TrendingUp,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    hoverGlow: 'hover:shadow-cyan-500/10',
  },
];

export function QuickActions({ onApply }: QuickActionsProps) {
  return (
    <div className="glass-panel rounded-xl p-6 border border-white/5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-cyan-400" />
        <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
      </div>

      {/* Action Grid */}
      <div className="grid grid-cols-2 gap-3">
        {ACTIONS.map((action) => (
          <button
            key={action.label}
            onClick={() => onApply(action.command)}
            className={cn(
              'group relative flex items-start gap-3 p-4 rounded-xl border transition-all duration-200',
              'bg-white/[0.02] hover:bg-white/[0.06]',
              action.border,
              'hover:shadow-lg',
              action.hoverGlow,
              'active:scale-[0.98]'
            )}
          >
            {/* Icon */}
            <div className={cn('p-2 rounded-lg shrink-0', action.bg)}>
              <action.icon className={cn('w-4 h-4', action.color)} />
            </div>

            {/* Text */}
            <div className="text-left min-w-0">
              <p className="text-sm font-medium text-white group-hover:text-white transition-colors">
                {action.label}
              </p>
              <p className="text-[10px] text-slate-500 leading-relaxed mt-0.5">
                {action.description}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-white/5">
        <p className="text-[10px] font-mono text-slate-600">
          Each action sends a command to the execution pipeline for confirmation
        </p>
      </div>
    </div>
  );
}
