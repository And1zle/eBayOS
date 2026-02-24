import React, { useState } from 'react';
import { Message, MessageThread } from '@/types';
import { cn } from '@/lib/utils';
import { Star, Send, Sparkles, Loader2, MessageSquare } from 'lucide-react';

interface MessageDetailProps {
  thread: MessageThread | null;
  replyDraft: string;
  onReplyDraftChange: (val: string) => void;
  onSendReply: (message: string) => void;
  sendStatus: 'idle' | 'sending' | 'confirming';
  onCancelConfirm: () => void;
  confirmReply: string | null;
  onConfirmSend: () => void;
}

const getDaysAgo = (ts: string) => Math.floor((Date.now() - new Date(ts).getTime()) / 86400000);

export function MessageDetail({
  thread,
  replyDraft,
  onReplyDraftChange,
  onSendReply,
  sendStatus,
  onCancelConfirm,
  confirmReply,
  onConfirmSend,
}: MessageDetailProps) {
  if (!thread) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-4 text-slate-500">
        <MessageSquare className="w-10 h-10" />
        <span className="text-sm">Select a message to view the conversation</span>
      </div>
    );
  }

  const { buyer_info, messages } = thread;

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Buyer Info Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Buyer ID</div>
          <div className="text-sm font-bold text-white truncate">{buyer_info.id}</div>
        </div>
        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Rating</div>
          <div className="flex items-center gap-1 mt-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  'w-3.5 h-3.5',
                  i < Math.round(buyer_info.rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-700'
                )}
              />
            ))}
            <span className="text-xs text-slate-400 ml-1">{buyer_info.rating}</span>
          </div>
        </div>
        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Transactions</div>
          <div className="text-lg font-bold text-white">{buyer_info.transaction_count}</div>
        </div>
      </div>

      {/* Conversation Thread */}
      <div className="flex-1 overflow-y-auto space-y-3 min-h-0 border-t border-white/10 pt-4">
        {messages.map(msg => (
          <div
            key={msg.message_id}
            className={cn(
              'p-4 rounded-lg border',
              msg.status === 'answered'
                ? 'bg-emerald-500/5 border-emerald-500/20 ml-8'
                : 'bg-white/3 border-white/5 mr-8'
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-white">{msg.buyer_name}</span>
              <span className="text-[10px] font-mono text-slate-500">{getDaysAgo(msg.timestamp)}d ago</span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">{msg.message_text}</p>
            {msg.listing_title && (
              <div className="mt-2 text-[10px] text-slate-600">
                Re: {msg.listing_title}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Confirm Panel */}
      {sendStatus === 'confirming' && confirmReply && (
        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
          <div className="text-[10px] text-blue-400 uppercase tracking-wider mb-2">Preview Reply</div>
          <p className="text-sm text-slate-300 mb-3">{confirmReply}</p>
          <div className="flex gap-2">
            <button
              onClick={onConfirmSend}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
            >
              Confirm Send
            </button>
            <button
              onClick={onCancelConfirm}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 text-xs font-semibold transition-colors border border-white/10"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Reply Composer */}
      {sendStatus !== 'confirming' && (
        <div className="border-t border-white/10 pt-4">
          <textarea
            value={replyDraft}
            onChange={e => onReplyDraftChange(e.target.value)}
            placeholder="Type your reply..."
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-slate-600 resize-none focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
          />
          <div className="flex items-center justify-between mt-2">
            <button
              disabled
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-600 text-xs cursor-not-allowed"
              title="Coming in Phase 2"
            >
              <Sparkles className="w-3 h-3" />
              AI Suggest
            </button>
            <button
              onClick={() => replyDraft.trim() && onSendReply(replyDraft.trim())}
              disabled={!replyDraft.trim() || sendStatus === 'sending'}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors',
                replyDraft.trim()
                  ? 'bg-blue-600 hover:bg-blue-500 text-white'
                  : 'bg-white/5 text-slate-600 cursor-not-allowed'
              )}
            >
              {sendStatus === 'sending' ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Send className="w-3 h-3" />
              )}
              Send Reply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
