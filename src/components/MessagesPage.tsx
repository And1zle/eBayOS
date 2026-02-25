import React, { useEffect, useState, useCallback } from 'react';
import { Message, MessageThread, MessageIntent } from '@/types';
import { MessageList } from './MessageList';
import { MessageDetail } from './MessageDetail';
import { useNotifications } from '../contexts/NotificationContext';
import { generateReplySuggestions, detectMessageIntent } from '../services/messageAnalyzer';

interface MessagesPageProps {
  sellerPersonality?: string;
}

const MOCK_MESSAGES: Message[] = [
  {
    message_id: 'm1',
    buyer_id: 'buyer_abc123',
    buyer_name: 'John B.',
    buyer_rating: 4.8,
    message_text: 'Is this item still available? I\'m interested in making an offer around $45 if you can do that.',
    timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
    status: 'unanswered',
    item_id: '136645465618',
    listing_title: 'Vintage Nike Air Jordan 11 Size 10',
  },
  {
    message_id: 'm2',
    buyer_id: 'buyer_xyz789',
    buyer_name: 'Sarah M.',
    buyer_rating: 5,
    message_text: 'Thanks for the fast shipping! Item arrived exactly as described.',
    timestamp: new Date(Date.now() - 5 * 86400000).toISOString(),
    status: 'answered',
  },
  {
    message_id: 'm3',
    buyer_id: 'buyer_abc123',
    buyer_name: 'John B.',
    buyer_rating: 4.8,
    message_text: 'Can you do $42 with combined shipping if I buy the other listing too?',
    timestamp: new Date(Date.now() - 1 * 86400000).toISOString(),
    status: 'unanswered',
    item_id: '136645465618',
    listing_title: 'Vintage Nike Air Jordan 11 Size 10',
  },
  {
    message_id: 'm4',
    buyer_id: 'buyer_def456',
    buyer_name: 'Mike R.',
    buyer_rating: 4.2,
    message_text: 'What\'s the condition of the sole? Any yellowing or creasing on the patent leather?',
    timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
    status: 'unanswered',
    item_id: '136645465620',
    listing_title: 'Air Jordan 1 Retro High OG',
  },
  {
    message_id: 'm5',
    buyer_id: 'buyer_ghi012',
    buyer_name: 'Lisa K.',
    buyer_rating: 4.9,
    message_text: 'Received! Perfect fit. Will definitely buy from you again.',
    timestamp: new Date(Date.now() - 7 * 86400000).toISOString(),
    status: 'answered',
  },
];

function buildThread(selected: Message, allMessages: Message[]): MessageThread {
  const threadMessages = allMessages
    .filter(m => m.buyer_id === selected.buyer_id)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const lastAnswered = threadMessages.filter(m => m.status === 'answered').pop();

  return {
    messages: threadMessages,
    buyer_info: {
      id: selected.buyer_id,
      rating: selected.buyer_rating,
      transaction_count: Math.floor(selected.buyer_rating * 2) || 5,
    },
    last_response_time: lastAnswered?.timestamp,
  };
}

export function MessagesPage({ sellerPersonality }: MessagesPageProps) {
  const { addNotification } = useNotifications();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [sendStatus, setSendStatus] = useState<'idle' | 'sending' | 'confirming'>('idle');
  const [confirmReply, setConfirmReply] = useState<string | null>(null);

  const thread: MessageThread | null = selectedMessage
    ? buildThread(selectedMessage, messages)
    : null;

  // Detect message intents on load and update
  useEffect(() => {
    const detectIntents = async (msgs: Message[]) => {
      const updated = await Promise.all(
        msgs.map(async (msg) => {
          if (!msg.intent) {
            try {
              const intent = await detectMessageIntent(msg.message_text);
              return { ...msg, intent };
            } catch (err) {
              console.error('Error detecting intent:', err);
              return msg;
            }
          }
          return msg;
        })
      );
      setMessages(updated);
    };

    const loadMessages = async () => {
      try {
        const response = await fetch('/api/messages');
        const data = await response.json();
        const msgs = (data.success && Array.isArray(data.messages) && data.messages.length > 0)
          ? data.messages
          : MOCK_MESSAGES;

        await detectIntents(msgs);
      } catch (err) {
        console.error('Error loading messages:', err);
        await detectIntents(MOCK_MESSAGES);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, []);

  const onSendReply = useCallback((message: string) => {
    setConfirmReply(message);
    setSendStatus('confirming');
  }, []);

  const onCancelConfirm = useCallback(() => {
    setConfirmReply(null);
    setSendStatus('idle');
  }, []);

  const onConfirmSend = useCallback(async () => {
    if (!confirmReply || !selectedMessage) return;
    setSendStatus('sending');
    try {
      const res = await fetch('/api/respond-to-buyer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: selectedMessage.buyer_id, message: confirmReply }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.success !== false && res.ok) {
        setReplyDraft('');
        setConfirmReply(null);
        setSendStatus('idle');
        setSelectedMessage(prev =>
          prev ? { ...prev, status: 'answered' as const } : null
        );
        setMessages(prev =>
          prev.map(m =>
            m.buyer_id === selectedMessage.buyer_id ? { ...m, status: 'answered' as const } : m
          )
        );
        addNotification({
          type: 'success',
          title: 'Reply Sent',
          message: `Message sent to ${selectedMessage.buyer_name}`,
        });
      } else {
        setSendStatus('idle');
        setConfirmReply(null);
        addNotification({
          type: 'error',
          title: 'Send Failed',
          message: 'Reply could not be delivered — try again',
        });
      }
    } catch (err) {
      setSendStatus('idle');
      setConfirmReply(null);
      addNotification({
        type: 'error',
        title: 'Connection Error',
        message: 'Could not reach server',
      });
    }
  }, [confirmReply, selectedMessage, addNotification]);

  return (
    <div className="glass-panel rounded-xl p-5 border border-white/5 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Messages</h2>
        <span className="text-[10px] font-mono text-slate-500">
          {messages.filter(m => m.status === 'unanswered').length} unanswered · {messages.length} total
        </span>
      </div>

      <div className="flex flex-1 min-h-0 gap-6">
        <div className="w-[30%] min-w-[240px] flex flex-col border-r border-white/5 pr-4">
          <MessageList
            messages={messages}
            selectedId={selectedMessage?.message_id ?? null}
            loading={loading}
            onSelectMessage={setSelectedMessage}
          />
        </div>
        <div className="flex-1 min-w-0 flex flex-col">
          <MessageDetail
            thread={thread}
            replyDraft={replyDraft}
            onReplyDraftChange={setReplyDraft}
            onSendReply={onSendReply}
            sendStatus={sendStatus}
            onCancelConfirm={onCancelConfirm}
            confirmReply={confirmReply}
            onConfirmSend={onConfirmSend}
            sellerPersonality={sellerPersonality}
          />
        </div>
      </div>
    </div>
  );
}
