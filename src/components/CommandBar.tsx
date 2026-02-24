import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, Sparkles, Loader2, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommandBarProps {
  onSubmit: (value: string) => void;
  isProcessing: boolean;
  prefill?: string;
}

export function CommandBar({ onSubmit, isProcessing, prefill }: CommandBarProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && value.trim() && !isProcessing) {
      onSubmit(value);
    }
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Accept prefill from parent (e.g. clicking "Update Price" on an inventory item)
  useEffect(() => {
    if (prefill) {
      setValue(prefill);
      inputRef.current?.focus();
    }
  }, [prefill]);

  return (
    <div className="w-full">
      <div className="relative group">
        {/* Glow Effect */}
        <div className={cn(
          "absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-cyan-500 to-indigo-500 rounded-2xl opacity-20 group-hover:opacity-40 transition duration-500 blur-lg",
          isProcessing && "opacity-50 animate-pulse"
        )} />
        
        <div className="relative flex items-center bg-[#0F131C] rounded-2xl border border-white/10 shadow-2xl overflow-hidden h-16">
          <div className="pl-5 text-blue-400">
            {isProcessing ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <MessageSquare className="w-6 h-6" />
            )}
          </div>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isProcessing}
            placeholder="Tell me what you want to do..."
            className="w-full px-4 py-5 text-lg bg-transparent border-none outline-none text-white placeholder:text-slate-500 font-medium"
          />
          <div className="pr-3 flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-white/5 border border-white/5">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-[10px] font-mono text-slate-400 uppercase">Ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
