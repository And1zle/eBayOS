import React from 'react';
import { LogEntry, Intent } from '@/types';
import { CheckCircle2, XCircle, Clock, AlertCircle, Terminal, ChevronRight } from 'lucide-react';
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
        <div className="max-h-64 overflow-y-auto p-4 space-y-1 font-mono text-xs">
          {logs.map((log) => (
            <div key={log.id} className="group flex items-start gap-3 p-2 rounded hover:bg-white/5 transition-colors">
              <div className="mt-0.5">
                <StatusIcon status={log.status} />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-blue-400 font-bold">API Call Sent:</span>
                  <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                    {log.intent}
                  </span>
                  <span className="text-slate-600 ml-auto">{new Date(log.timestamp).toLocaleTimeString()}</span>
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
              </div>
            </div>
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
