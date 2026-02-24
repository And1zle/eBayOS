/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { RightSidebar } from './components/RightSidebar';
import { CommandBar } from './components/CommandBar';
import { ExecutionPanel } from './components/ExecutionPanel';
import { AuditLog } from './components/AuditLog';
import { Preferences } from './components/Preferences';
import { SmartSuggestions } from './components/SmartSuggestions';
import { MarketPulse } from './components/MarketPulse';
import { ActivityNoiseField } from './components/ActivityNoiseField';
import { VisionUplinkPage } from './components/VisionUplinkPage';
import { InventoryPage } from './components/InventoryPage';
import { MessagesPage } from './components/MessagesPage';
import { AnalyticsPage } from './components/AnalyticsPage';
import { WatchlistHeatmap } from './components/WatchlistHeatmap';
import { QuickActions } from './components/QuickActions';
import { parseCommand } from './services/intentParser';
import { executeSpell } from './services/spellExecutor';
import { ParsedCommand, LogEntry, Intent } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Bell, DollarSign, Package, MessageSquare as MsgIcon, ShoppingCart } from 'lucide-react';
import { cn } from './lib/utils';

type View = 'control-plane' | 'spellbook' | 'audit-log' | 'preferences' | 'vision-uplink' | 'inventory' | 'orders' | 'messages' | 'analytics';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('control-plane');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentCommand, setCurrentCommand] = useState<ParsedCommand | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [inputHistory, setInputHistory] = useState<string>("");
  const [prefillCommand, setPrefillCommand] = useState<string>("");

  // Quick-stats state
  const [quickStats, setQuickStats] = useState({ totalValue: 0, activeListings: 0, unansweredMessages: 0, pendingOrders: 0 });
  const [badges, setBadges] = useState<Record<string, number>>({});

  useEffect(() => {
    // Fetch listing stats
    fetch('/api/active-listings')
      .then(r => r.json())
      .then(d => {
        const items = d.items || [];
        const totalValue = items.reduce((s: number, i: any) => s + (parseFloat(i.price) || 0), 0);
        setQuickStats(prev => ({ ...prev, totalValue, activeListings: items.length }));
      })
      .catch(() => {});
    // Fetch message stats
    fetch('/api/messages')
      .then(r => r.json())
      .then(d => {
        const msgs = d.messages || d || [];
        const unanswered = Array.isArray(msgs) ? msgs.filter((m: any) => m.status === 'unanswered').length : 0;
        setQuickStats(prev => ({ ...prev, unansweredMessages: unanswered }));
        if (unanswered > 0) setBadges(prev => ({ ...prev, messages: unanswered }));
      })
      .catch(() => {});
  }, []);

  const handleCommandSubmit = async (input: string) => {
    setCurrentView('control-plane');
    setIsProcessing(true);
    setInputHistory(input);

    await new Promise(resolve => setTimeout(resolve, 400));

    const result = await parseCommand(input);
    setCurrentCommand(result);
    setIsProcessing(false);
  };

  // Called when user clicks Confirm in ExecutionPanel
  // Now actually executes the spell against the backend
  const handleConfirm = async () => {
    if (!currentCommand) return;

    setIsProcessing(true);

    let status: LogEntry['status'] = 'success';
    let details = '';
    let itemLogs: LogEntry['itemLogs'] = undefined;

    try {
      const result = await executeSpell(currentCommand);
      status = result.success ? 'success' : 'failed';
      details = result.message;
      if (result.data?.itemLogs) itemLogs = result.data.itemLogs;
    } catch (err: any) {
      status = 'failed';
      details = `Execution error: ${err.message}`;
    }

    const newLog: LogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      raw_input: inputHistory,
      intent: currentCommand.intent,
      confidence: currentCommand.confidence,
      status,
      details,
      itemLogs,
    };

    setLogs(prev => [newLog, ...prev]);
    setCurrentCommand(null);
    setInputHistory("");
    setIsProcessing(false);
  };

  const handleCancel = () => {
    setCurrentCommand(null);
    setInputHistory("");
  };

  const handleFieldChange = (field: string, value: any) => {
    if (!currentCommand) return;
    setCurrentCommand({
      ...currentCommand,
      fields: {
        ...currentCommand.fields,
        [field]: value,
      },
    });
  };

  // Used by InventoryPage to pre-fill a command from a listing action
  const handlePrefillCommand = (text: string) => {
    setPrefillCommand(text);
    setCurrentView('control-plane');
    setTimeout(() => setPrefillCommand(""), 100);
  };

  return (
    <div className="flex h-screen bg-[#0B0E14] overflow-hidden text-slate-200 font-sans selection:bg-blue-500/30 relative">
      <ActivityNoiseField salesVolume={0.8} marketShare={0.4} />

      <Sidebar
        currentView={currentView}
        onViewChange={(v) => setCurrentView(v as View)}
        badges={badges}
        className="z-20 relative"
      />

      <main className="flex-1 flex flex-col h-screen relative overflow-hidden z-10">
        {/* Top Header */}
        <header className="h-16 border-b border-white/5 bg-[#0B0E14]/50 backdrop-blur-sm flex items-center justify-between px-6 z-20">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search inventory, orders, or commands..."
                className="w-full bg-slate-900/50 border border-white/5 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-[#0B0E14]" />
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-8 relative z-10">

          {/* ── Control Plane (Dashboard) ───────────────────────────────────── */}
          {currentView === 'control-plane' && (
            <div className="w-full space-y-8">
              {/* Status Line */}
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <span>System Online</span>
                <span className="text-slate-600">•</span>
                <span>v2.4.0-beta</span>
                <span className="text-slate-600">•</span>
                <span className="text-emerald-400 text-xs">Backend connected → 100.67.134.63:5000</span>
              </div>

              {/* Quick Stats Row */}
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: 'Total Listed Value', value: `$${quickStats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
                  { label: 'Active Listings', value: quickStats.activeListings.toString(), icon: Package, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
                  { label: 'Unanswered Messages', value: quickStats.unansweredMessages.toString(), icon: MsgIcon, color: quickStats.unansweredMessages > 0 ? 'text-amber-400' : 'text-slate-400', bg: quickStats.unansweredMessages > 0 ? 'bg-amber-500/10' : 'bg-white/5', border: quickStats.unansweredMessages > 0 ? 'border-amber-500/20' : 'border-white/5' },
                  { label: 'Pending Orders', value: quickStats.pendingOrders.toString(), icon: ShoppingCart, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
                ].map((stat) => (
                  <div key={stat.label} className={cn('glass-panel rounded-xl p-4 border', stat.border)}>
                    <div className="flex items-center gap-3">
                      <div className={cn('p-2 rounded-lg', stat.bg)}>
                        <stat.icon className={cn('w-4 h-4', stat.color)} />
                      </div>
                      <div>
                        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">{stat.label}</p>
                        <p className={cn('text-xl font-bold', stat.color)}>{stat.value}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <CommandBar
                onSubmit={handleCommandSubmit}
                isProcessing={isProcessing}
                prefill={prefillCommand}
              />

              <AnimatePresence mode="wait">
                {currentCommand && (
                  <ExecutionPanel
                    command={currentCommand}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                    onFieldChange={handleFieldChange}
                  />
                )}
              </AnimatePresence>

              {/* Intelligence Layer */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SmartSuggestions onApply={handleCommandSubmit} />
                <MarketPulse />
              </div>

              {/* Action Layer */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <WatchlistHeatmap />
                <QuickActions onApply={handleCommandSubmit} />
              </div>

              <AuditLog logs={logs} />
            </div>
          )}

          {/* ── Other Views ─────────────────────────────────────────────────── */}
          {currentView === 'vision-uplink' && <VisionUplinkPage />}
          {currentView === 'inventory' && <InventoryPage onAddToCommand={handlePrefillCommand} />}
          {currentView === 'preferences' && <Preferences />}
          {currentView === 'audit-log' && (
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-white mb-6">Audit Log</h2>
              <AuditLog logs={logs} />
            </div>
          )}
          {currentView === 'messages' && <MessagesPage />}
          {currentView === 'analytics' && <AnalyticsPage />}
          {currentView === 'orders' && (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
              <div className="text-5xl mb-4 opacity-20">🚧</div>
              <p className="text-lg font-medium">Orders</p>
              <p className="text-sm mt-2">Coming soon — Phase 4</p>
            </div>
          )}
        </div>
      </main>

      <RightSidebar onSelectExample={handleCommandSubmit} />
    </div>
  );
}
