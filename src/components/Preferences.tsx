import React from 'react';
import { Save } from 'lucide-react';

export function Preferences() {
  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-zinc-900">Preferences</h2>
        <p className="text-zinc-500 mt-1">
          Configure your default seller settings and automation rules.
        </p>
      </div>

      <div className="space-y-6">
        {/* Shipping Defaults */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
            <h3 className="font-semibold text-zinc-900">Shipping Defaults</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Default Policy
                </label>
                <select className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
                  <option>Calculated Shipping</option>
                  <option>Free Shipping</option>
                  <option>Flat Rate</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Handling Time (Days)
                </label>
                <select className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
                  <option>1 Day</option>
                  <option>2 Days</option>
                  <option>3 Days</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Strategy */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
            <h3 className="font-semibold text-zinc-900">Pricing Strategy</h3>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Auto-Accept Threshold Default
              </label>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  placeholder="80" 
                  className="w-24 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <span className="text-sm text-zinc-500">% of listing price</span>
              </div>
              <p className="text-xs text-zinc-500 mt-1.5">
                When you say "enable offers", we'll suggest this threshold automatically.
              </p>
            </div>
          </div>
        </div>

        {/* Tone Profile */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
            <h3 className="font-semibold text-zinc-900">Communication Tone</h3>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Buyer Response Style
              </label>
              <div className="grid grid-cols-3 gap-3">
                {['Professional', 'Friendly', 'Direct'].map((tone) => (
                  <label key={tone} className="flex items-center justify-center px-4 py-3 border border-zinc-200 rounded-lg cursor-pointer hover:bg-zinc-50 has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50 has-[:checked]:text-indigo-700 transition-all">
                    <input type="radio" name="tone" className="hidden" defaultChecked={tone === 'Professional'} />
                    <span className="text-sm font-medium">{tone}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button className="flex items-center gap-2 px-6 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-medium text-sm transition-colors shadow-sm">
            <Save className="w-4 h-4" />
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}
