import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Message, MessageThread, ActiveListing } from '@/types';
import { cn } from '@/lib/utils';
import { Star, Send, Sparkles, Loader2, MessageSquare, Lightbulb, Eye, TrendingUp } from 'lucide-react';
import { generateReplySuggestions, extractItemReference } from '../services/messageAnalyzer';

interface MessageDetailProps {
  thread: MessageThread | null;
  replyDraft: string;
  onReplyDraftChange: (val: string) => void;
  onSendReply: (message: string) => void;
  sendStatus: 'idle' | 'sending' | 'confirming';
  onCancelConfirm: () => void;
  confirmReply: string | null;
  onConfirmSend: () => void;
  sellerPersonality?: string;
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
  sellerPersonality,
}: MessageDetailProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [referencedItem, setReferencedItem] = useState<ActiveListing | null>(null);
  const [loadingItem, setLoadingItem] = useState(false);
  const suggestionCacheRef = useRef<Record<string, string[]>>({});

  if (!thread) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-4 text-slate-500">
        <MessageSquare className="w-10 h-10" />
        <span className="text-sm">Select a message to view the conversation</span>
      </div>
    );
  }

  const { buyer_info, messages } = thread;
  const lastMessage = messages[messages.length - 1];

  // Reset state when thread changes
  useEffect(() => {
    setSuggestions([]);
    setShowSuggestions(false);
    setReferencedItem(null);

    // Extract item reference from last message
    const extractItem = async () => {
      if (!lastMessage?.message_text) return;
      setLoadingItem(true);
      try {
        // Fetch active listings for reference matching
        const res = await fetch('/api/active-listings');
        const data = await res.json();
        const items = data.items || [];
        const item = await extractItemReference(lastMessage.message_text, items);
        setReferencedItem(item);
      } catch (err) {
        console.error('Error extracting item reference:', err);
      } finally {
        setLoadingItem(false);
      }
    };

    extractItem();
  }, [thread?.messages[0]?.message_id, lastMessage?.message_text]);

  // Debounced suggestion generation with caching
  const handleGenerateSuggestions = useCallback(async () => {
    if (!lastMessage) return;

    // Check cache first
    if (suggestionCacheRef.current[lastMessage.message_id]) {
      setSuggestions(suggestionCacheRef.current[lastMessage.message_id]);
      setShowSuggestions(true);
      return;
    }

    setLoadingSuggestions(true);
    try {
      const sugg = await generateReplySuggestions(lastMessage, sellerPersonality);
      setSuggestions(sugg);
      suggestionCacheRef.current[lastMessage.message_id] = sugg;
      setShowSuggestions(true);
    } catch (err) {
      console.error('Error generating suggestions:', err);
    } finally {
      setLoadingSuggestions(false);
    }
  }, [lastMessage, sellerPersonality]);

  const handleUseSuggestion = useCallback((suggestion: string) => {
    onReplyDraftChange(suggestion);
    setShowSuggestions(false);
  }, [onReplyDraftChange]);

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
          <div key={msg.message_id}>
            <div
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

            {/* Item Reference Card - Show for last message if item found */}
            {msg.message_id === lastMessage?.message_id && referencedItem && !loadingItem && (
              <div className="ml-8 mt-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-white/10 border border-white/10 overflow-hidden flex items-center justify-center">
                  {referencedItem.imageUrl ? (
                    <img src={referencedItem.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-6 h-6 text-slate-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{referencedItem.title}</p>
                  <p className="text-sm font-bold text-emerald-400 mt-0.5">${referencedItem.price.toFixed(2)}</p>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500">
                    {referencedItem.watchers !== undefined && (
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>{referencedItem.watchers} watchers</span>
                      </div>
                    )}
                    {referencedItem.bids !== undefined && referencedItem.bids > 0 && (
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>{referencedItem.bids} bids</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Loading state for item extraction */}
            {msg.message_id === lastMessage?.message_id && loadingItem && (
              <div className="ml-8 mt-3 p-3 rounded-lg bg-white/5 border border-white/10 flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                <span className="text-xs text-slate-400">Looking for referenced item...</span>
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
        <div className="border-t border-white/10 pt-4 space-y-3">
          <textarea
            value={replyDraft}
            onChange={e => onReplyDraftChange(e.target.value)}
            placeholder="Type your reply..."
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-slate-600 resize-none focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
          />

          {/* AI Suggestions Panel */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-semibold text-blue-400">AI Suggestions</span>
              </div>
              <div className="space-y-2">
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleUseSuggestion(suggestion)}
                    className="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/30 text-sm text-slate-300 hover:text-white transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              onClick={handleGenerateSuggestions}
              disabled={loadingSuggestions}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                loadingSuggestions
                  ? 'bg-white/5 text-slate-600 cursor-not-allowed'
                  : 'bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 hover:text-blue-300'
              )}
            >
              {loadingSuggestions ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Sparkles className="w-3 h-3" />
              )}
              {loadingSuggestions ? 'Generating...' : 'AI Suggest'}
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
