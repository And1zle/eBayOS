import React from 'react';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Package, ShoppingCart, MessageSquare, BarChart2, Settings, LogOut, User, ScanEye, Award } from 'lucide-react';
import { IntuitionEngine } from './IntuitionEngine';

type AppView = 'control-plane' | 'spellbook' | 'audit-log' | 'preferences' | 'vision-uplink' | 'inventory' | 'orders' | 'messages' | 'analytics';

interface SidebarProps {
  className?: string;
  currentView: AppView;
  onViewChange: (view: AppView) => void;
}

export function Sidebar({ className, currentView, onViewChange }: SidebarProps) {
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', id: 'control-plane' as const },
    { icon: ScanEye, label: 'Vision Uplink', id: 'vision-uplink' as const },
    { icon: Package, label: 'Inventory', id: 'inventory' as const },
    { icon: ShoppingCart, label: 'Orders', id: 'orders' as const },
    { icon: MessageSquare, label: 'Messages', id: 'messages' as const },
    { icon: BarChart2, label: 'Analytics', id: 'analytics' as const },
    { icon: Settings, label: 'Settings', id: 'preferences' as const },
  ];

  return (
    <div className={cn("w-96 flex flex-col h-screen border-r border-white/5 bg-[#0B0E14]/80 backdrop-blur-xl", className)}>
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
          <span className="font-bold text-white text-lg">e</span>
        </div>
        <span className="font-bold text-xl tracking-tight text-white">eBayOS</span>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => onViewChange(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden",
              currentView === item.id
                ? "text-white bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]" 
                : "text-slate-400 hover:text-white hover:bg-white/5"
            )}
          >
            {currentView === item.id && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-full shadow-[0_0_10px_#3b82f6]" />
            )}
            <item.icon className={cn("w-5 h-5 transition-colors", currentView === item.id ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300")} />
            {item.label}
          </button>
        ))}
      </div>

      {/* Bottom Section */}
      <div className="p-4 space-y-4">
        {/* Intuition Engine Widget (Includes User Profile) */}
        <div className="origin-bottom">
           <IntuitionEngine />
        </div>
      </div>
    </div>
  );
}
