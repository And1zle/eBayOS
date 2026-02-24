import React, { useState, useRef, useEffect } from 'react';
import { Loader2, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommandBarProps {
  onSubmit: (value: string) => void;
  isProcessing: boolean;
  prefill?: string;
}

const COMMAND_HINTS = [
  'Decrease all prices by 5%',
  'Decrease all prices by 10%',
  'Increase all prices by 5%',
  'Update listing price to $',
  'End listing',
  'Enable offers on listing',
  'Send offer to watchers on listing',
  'Duplicate listing',
  'End all listings older than 90 days',
  'End all listings below $5',
  'Set handling time to 1 day',
  'Enable vacation mode',
];

export function CommandBar({ onSubmit, isProcessing, prefill }: CommandBarProps) {
  const [value, setValue] = useState('');
  const [hints, setHints] = useState<string[]>([]);
  const [selectedHint, setSelectedHint] = useState(-1);
  const [showHints, setShowHints] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showHints && hints.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedHint(prev => (prev + 1) % hints.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedHint(prev => prev <= 0 ? hints.length - 1 : prev - 1);
        return;
      }
      if (e.key === 'Tab' && selectedHint >= 0) {
        e.preventDefault();
        setValue(hints[selectedHint]);
        setShowHints(false);
        setSelectedHint(-1);
        return;
      }
      if (e.key === 'Escape') {
        setShowHints(false);
        setSelectedHint(-1);
        return;
      }
    }
    if (e.key === 'Enter' && value.trim() && !isProcessing) {
      setShowHints(false);
      onSubmit(value);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setValue(v);
    if (v.trim().length >= 2) {
      const lower = v.toLowerCase();
      const matched = COMMAND_HINTS.filter(h => h.toLowerCase().includes(lower)).slice(0, 5);
      setHints(matched);
      setShowHints(matched.length > 0);
      setSelectedHint(-1);
    } else {
      setShowHints(false);
      setHints([]);
    }
  };

  const selectHint = (hint: string) => {
    setValue(hint);
    setShowHints(false);
    setSelectedHint(-1);
    inputRef.current?.focus();
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (prefill) {
      setValue(prefill);
      setShowHints(false);
      inputRef.current?.focus();
    }
  }, [prefill]);

  // Close hints on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (hintRef.current && !hintRef.current.contains(e.target as Node)) {
        setShowHints(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="w-full relative" ref={hintRef}>
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
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => { if (hints.length > 0 && value.trim().length >= 2) setShowHints(true); }}
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

      {/* Autocomplete dropdown */}
      {showHints && hints.length > 0 && (
        <div className="absolute z-50 top-full mt-2 left-0 right-0 bg-[#0F131C] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
          {hints.map((hint, i) => (
            <button
              key={hint}
              onClick={() => selectHint(hint)}
              className={cn(
                'w-full text-left px-5 py-3 text-sm transition-colors flex items-center gap-3',
                i === selectedHint
                  ? 'bg-blue-500/15 text-white'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              )}
            >
              <span className="text-blue-500/50 text-xs font-mono">⌘</span>
              {hint}
            </button>
          ))}
          <div className="px-5 py-2 border-t border-white/5 flex items-center gap-3 text-[10px] text-slate-600 font-mono">
            <span>↑↓ navigate</span>
            <span>Tab accept</span>
            <span>Esc dismiss</span>
          </div>
        </div>
      )}
    </div>
  );
}
