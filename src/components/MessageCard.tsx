import React from 'react';
import { Message, MessageIntent } from '@/types';
import { cn } from '@/lib/utils';
import { Star, AlertCircle, DollarSign, Package, Gift, AlertTriangle, Smile } from 'lucide-react';

interface MessageCardProps {
  message: Message;
  selected: boolean;
  onClick: () => void;
}

const intentConfig = {
  [MessageIntent.PRICE_INQUIRY]: { icon: DollarSign, label: 'Price', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  [MessageIntent.SHIPPING_QUESTION]: { icon: Package, label: 'Shipping', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  [MessageIntent.BULK_OFFER]: { icon: Gift, label: 'Bulk', color: 'text-violet-400', bg: 'bg-violet-500/10' },
  [MessageIntent.COMPLAINT]: { icon: AlertTriangle, label: 'Issue', color: 'text-red-400', bg: 'bg-red-500/10' },
  [MessageIntent.PRAISE]: { icon: Smile, label: 'Praise', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  [MessageIntent.OTHER]: { icon: AlertCircle, label: 'Other', color: 'text-slate-400', bg: 'bg-slate-500/10' },
};

const getDaysAgo = (ts: string) => Math.floor((Date.now() - new Date(ts).getTime()) / 86400000);

const isUrgent = (text: string) =>
  /offer|deal|discount|negotiate|price|buy|purchase|bundle/i.test(text);

export function MessageCard({ message, selected, onClick }: MessageCardProps) {
  const days = getDaysAgo(message.timestamp);
  const urgent = isUrgent(message.message_text);
  const intentCfg = message.intent ? intentConfig[message.intent] : null;
  const Icon = intentCfg?.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-4 rounded-lg border transition-all duration-150',
        selected
          ? 'bg-blue-500/10 border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.1)]'
          : 'bg-white/3 border-white/5 hover:bg-white/5 hover:border-white/10'
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">{message.buyer_name}</span>
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  'w-2.5 h-2.5',
                  i < Math.round(message.buyer_rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-700'
                )}
              />
            ))}
          </div>
          {intentCfg && Icon && (
            <div className={cn('flex items-center gap-1 px-1.5 py-0.5 rounded', intentCfg.bg)}>
              <Icon className={cn('w-3 h-3', intentCfg.color)} />
              <span className={cn('text-[9px] font-semibold', intentCfg.color)}>{intentCfg.label}</span>
            </div>
          )}
          {urgent && !intentCfg && <AlertCircle className="w-3.5 h-3.5 text-amber-400" />}
        </div>
        <span className="text-[10px] font-mono text-slate-500">{days}d ago</span>
      </div>

      <p className="text-xs text-slate-400 line-clamp-2 mb-2">{message.message_text}</p>

      <div className="flex items-center justify-between">
        {message.listing_title && (
          <span className="text-[10px] text-slate-600 truncate max-w-[70%]">{message.listing_title}</span>
        )}
        <span
          className={cn(
            'text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full',
            message.status === 'answered'
              ? 'text-emerald-400 bg-emerald-500/10'
              : 'text-amber-400 bg-amber-500/10'
          )}
        >
          {message.status}
        </span>
      </div>
    </button>
  );
}
