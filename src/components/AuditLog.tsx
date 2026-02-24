import React, { useState } from 'react';
import { LogEntry, Intent } from '@/types';
import { CheckCircle2, XCircle, Clock, AlertCircle, Terminal, ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuditLogProps {
  logs: LogEntry[];
}

export function AuditLog({ logs }: AuditLogProps) {
  if (logs.length === 0) return null;

  return (
    <div className="w-full mt-8">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-sm font-semibold text-slate-400 flex items-center gap-2">
          <Terminal className="w-4 h-4" />
          Console Output
        </h3>
        <span className="text-xs font-mono text-slate-600">{new Date().toLocaleTimeString()}</span>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden border border-white/5 bg-[#0A0E17]/80">
        <div className="max-h-[420px] overflow-y-auto p-4 space-y-1 font-mono text-xs">
          {logs.map((log) => (
            <LogRow key={log.id} log={log} />
          ))}
          <div className="flex items-center gap-2 text-slate-600 p-2 animate-pulse">
            <ChevronRight className="w-3 h-3" />
            <span>Waiting for input...</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function LogRow({ log }: { log: LogEntry }) {
  const [expanded, setExpanded] = useState(false);
  const hasItemLogs = log.itemLogs && log.itemLogs.length > 0;
  const successCount = log.itemLogs?.filter(l => l.success).length ?? 0;
  const failCount = log.itemLogs?.filter(l => !l.success).length ?? 0;

  return (
    <div className="group rounded hover:bg-white/5 transition-colors">
      <div className="flex items-start gap-3 p-2">
        <div className="mt-0.5">
          <StatusIcon status={log.status} />
        </div>
        <div className="flex-1 space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-blue-400 font-bold">API Call Sent:</span>
            <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
              {log.intent}
            </span>
            <span className="text-slate-600 ml-auto shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
          </div>
          <div className="text-slate-300 pl-4 border-l border-slate-700/50">
            <div className="text-slate-500">// {log.raw_input}</div>
            <div className="text-emerald-400 mt-1">
              {`{`}
              <div className="pl-4 text-slate-300">
                status: <span className="text-emerald-300">"{log.status}"</span>,
              </div>
              <div className="pl-4 text-slate-300">
                details: <span className="text-amber-200">"{log.details}"</span>
              </div>
              {`}`}
            </div>
          </div>

          {/* Expandable item-level details */}
          {hasItemLogs && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-2 mt-2 px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-[11px]"
            >
              {expanded ? <ChevronDown className="w-3 h-3 text-slate-400" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
              <span className="text-slate-400">Item Details</span>
              <span className="text-emerald-400 font-bold">{successCount} ✓</span>
              {failCount > 0 && <span className="text-red-400 font-bold">{failCount} ✗</span>}
              <span className="text-slate-600">({log.itemLogs!.length} total)</span>
            </button>
          )}
        </div>
      </div>

      {/* Expanded item log rows */}
      {expanded && hasItemLogs && (
        <div className="ml-10 mb-2 mr-2 rounded-lg border border-white/5 bg-[#060910]/80 overflow-hidden">
          <div className="max-h-60 overflow-y-auto divide-y divide-white/5">
            {log.itemLogs!.map((item, i) => (
              <div key={i} className={cn(
                'flex items-center gap-3 px-3 py-2 text-[11px]',
                item.success ? 'hover:bg-emerald-500/5' : 'hover:bg-red-500/5'
              )}>
                <span className={item.success ? 'text-emerald-400' : 'text-red-400'}>
                  {item.success ? '✓' : '✗'}
                </span>
                <span className="text-slate-500 font-mono w-28 shrink-0 truncate">{item.itemId}</span>
                <span className="text-slate-400 truncate flex-1" title={item.title}>
                  {item.title.length > 45 ? item.title.substring(0, 45) + '…' : item.title}
                </span>
                {item.success ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-slate-600 line-through">${item.oldPrice.toFixed(2)}</span>
                    <span className="text-slate-700">→</span>
                    <span className="text-emerald-400 font-bold">${item.newPrice.toFixed(2)}</span>
                  </div>
                ) : (
                  <span className="text-red-400/70 shrink-0 truncate max-w-[200px]" title={item.error}>
                    {item.error || 'Failed'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusIcon({ status }: { status: LogEntry['status'] }) {
  switch (status) {
    case 'success':
      return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
    case 'failed':
      return <XCircle className="w-3.5 h-3.5 text-red-500" />;
    case 'pending':
      return <Clock className="w-3.5 h-3.5 text-blue-500" />;
    case 'requires_confirmation':
      return <AlertCircle className="w-3.5 h-3.5 text-amber-500" />;
    default:
      return null;
  }
}
