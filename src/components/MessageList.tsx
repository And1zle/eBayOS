import React from 'react';
import { Message } from '@/types';
import { MessageCard } from './MessageCard';
import { Loader2, Inbox } from 'lucide-react';

interface MessageListProps {
  messages: Message[];
  selectedId: string | null;
  loading: boolean;
  onSelectMessage: (msg: Message) => void;
}

export function MessageList({ messages, selectedId, loading, onSelectMessage }: MessageListProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-3 text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-xs">Loading messages...</span>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-3 text-slate-500">
        <Inbox className="w-8 h-8" />
        <span className="text-xs">No messages yet</span>
      </div>
    );
  }

  const sorted = [...messages].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="flex flex-col gap-2 overflow-y-auto flex-1 pr-1">
      {sorted.map(msg => (
        <MessageCard
          key={msg.message_id}
          message={msg}
          selected={selectedId === msg.message_id}
          onClick={() => onSelectMessage(msg)}
        />
      ))}
    </div>
  );
}
