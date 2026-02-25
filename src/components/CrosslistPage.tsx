import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Check, X, AlertCircle, Loader2, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CrosslistListing } from '../types';

interface CrosslistPageProps {
  items: CrosslistListing[];
  onComplete: () => void;
}

type ItemStatus = 'pending' | 'success' | 'error' | 'processing';

interface CrosslistItemState {
  itemId: string;
  status: ItemStatus;
  error?: string;
}

export function CrosslistPage({ items, onComplete }: CrosslistPageProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [editedItems, setEditedItems] = useState<Record<string, CrosslistListing>>(
    Object.fromEntries(items.map(item => [item.itemId, { ...item }]))
  );
  const [itemStates, setItemStates] = useState<Record<string, CrosslistItemState>>(
    Object.fromEntries(items.map(item => [item.itemId, { itemId: item.itemId, status: 'pending' }]))
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [extensionInstalled, setExtensionInstalled] = useState(false);

  const currentItem = items[selectedIndex];
  const currentEdited = editedItems[currentItem.itemId] || currentItem;
  const successCount = Object.values(itemStates).filter(s => s.status === 'success').length;

  const handleSendToPoshmark = async () => {
    setIsProcessing(true);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const edited = editedItems[item.itemId] || item;

      try {
        setItemStates(prev => ({
          ...prev,
          [item.itemId]: { itemId: item.itemId, status: 'processing' },
        }));

        // Upload images
        if (edited.images && edited.images.length > 0) {
          for (const imgUrl of edited.images) {
            try {
              // If URL is already a data URL, extract base64
              let base64 = imgUrl;
              if (!imgUrl.startsWith('data:')) {
                // Fetch image and convert to base64
                const resp = await fetch(imgUrl);
                const blob = await resp.blob();
                const reader = new FileReader();
                base64 = await new Promise((resolve) => {
                  reader.onloadend = () => resolve(reader.result as string);
                  reader.readAsDataURL(blob);
                });
              }

              // Upload to backend
              const uploadResp = await fetch('/api/upload-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  base64,
                  filename: `${item.itemId}_${Date.now()}.jpg`,
                }),
              });

              if (!uploadResp.ok) throw new Error('Upload failed');
              const uploadData = await uploadResp.json();
              console.log(`Image uploaded: ${uploadData.url}`);
            } catch (err: any) {
              console.error('Image upload error:', err);
              // Continue to next image on error
            }
          }
        }

        // Simulate brief processing delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Check if extension is available
        if (extensionInstalled) {
          // Send to extension via postMessage
          window.postMessage({
            type: 'CROSSLIST_ITEM',
            data: {
              itemId: item.itemId,
              title: edited.title,
              price: edited.poshmarkPrice || edited.price,
              size: edited.poshmarkSize,
              brand: edited.poshmarkBrand,
              description: edited.description,
            },
          }, '*');

          // Wait for extension response or timeout
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
          // Fall back to backend endpoint
          const response = await fetch('/api/crosslist/poshmark', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items: [edited],
              extensionInstalled: false,
            }),
          });

          if (!response.ok) {
            throw new Error(`Backend error: ${response.statusText}`);
          }
        }

        setItemStates(prev => ({
          ...prev,
          [item.itemId]: { itemId: item.itemId, status: 'success' },
        }));
      } catch (err: any) {
        setItemStates(prev => ({
          ...prev,
          [item.itemId]: {
            itemId: item.itemId,
            status: 'error',
            error: err.message || 'Unknown error',
          },
        }));
      }
    }

    setIsProcessing(false);

    // Show success message and auto-navigate after 3s
    setTimeout(() => {
      onComplete();
    }, 3000);
  };

  return (
    <div className="flex-1 flex flex-col h-full p-8 relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={onComplete}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">Crosslist to Poshmark</h1>
            <p className="text-sm text-slate-400 mt-1">
              {items.length} items selected {successCount > 0 && `· ${successCount} completed`}
            </p>
          </div>
        </div>
      </div>

      {/* Extension Status Banner */}
      <div
        className={cn(
          'mb-6 p-4 rounded-xl border flex items-center gap-3',
          extensionInstalled
            ? 'bg-emerald-500/10 border-emerald-500/20'
            : 'bg-amber-500/10 border-amber-500/20'
        )}
      >
        <AlertCircle className={cn('w-5 h-5', extensionInstalled ? 'text-emerald-400' : 'text-amber-400')} />
        <div>
          <p className={cn('text-sm font-medium', extensionInstalled ? 'text-emerald-400' : 'text-amber-400')}>
            {extensionInstalled
              ? 'Browser extension detected — will auto-fill Poshmark forms'
              : 'Extension not detected — will use fallback posting mode'}
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        {/* Left Panel: Review (60%) */}
        <div className="lg:col-span-2 overflow-y-auto pr-4">
          <div className="glass-panel rounded-xl border border-white/5 p-6 space-y-6">
            {/* Image Carousel */}
            {currentEdited.images && currentEdited.images.length > 0 ? (
              <div className="relative">
                <img
                  src={currentEdited.images[0]}
                  alt={currentEdited.title}
                  className="w-full h-64 object-cover rounded-lg bg-white/5"
                />
                <div className="absolute top-2 right-2 bg-black/50 px-2 py-1 rounded text-xs text-white">
                  {currentEdited.images.length} images
                </div>
              </div>
            ) : (
              <div className="w-full h-64 bg-white/5 rounded-lg flex items-center justify-center">
                <ImageIcon className="w-16 h-16 text-slate-600" />
              </div>
            )}

            {/* Title & Condition */}
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Title</label>
              <input
                type="text"
                value={currentEdited.title}
                onChange={(e) =>
                  setEditedItems(prev => ({
                    ...prev,
                    [currentItem.itemId]: { ...currentEdited, title: e.target.value },
                  }))
                }
                className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50"
              />
              <p className="text-xs text-slate-500 mt-1">Condition: {currentEdited.condition}</p>
            </div>

            {/* Price Field */}
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Poshmark Price</label>
              <div className="flex gap-2">
                <span className="text-sm text-slate-400 py-2">$</span>
                <input
                  type="number"
                  value={currentEdited.poshmarkPrice || currentEdited.price}
                  onChange={(e) =>
                    setEditedItems(prev => ({
                      ...prev,
                      [currentItem.itemId]: { ...currentEdited, poshmarkPrice: parseFloat(e.target.value) },
                    }))
                  }
                  step="0.01"
                  className="flex-1 bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">Original eBay price: ${currentEdited.price}</p>
            </div>

            {/* Size & Brand */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Size</label>
                <input
                  type="text"
                  value={currentEdited.poshmarkSize || ''}
                  onChange={(e) =>
                    setEditedItems(prev => ({
                      ...prev,
                      [currentItem.itemId]: { ...currentEdited, poshmarkSize: e.target.value },
                    }))
                  }
                  placeholder="e.g., M, Large, One Size"
                  className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Brand</label>
                <input
                  type="text"
                  value={currentEdited.poshmarkBrand || ''}
                  onChange={(e) =>
                    setEditedItems(prev => ({
                      ...prev,
                      [currentItem.itemId]: { ...currentEdited, poshmarkBrand: e.target.value },
                    }))
                  }
                  placeholder="e.g., Nike, Gucci"
                  className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Description</label>
              <textarea
                value={currentEdited.description || ''}
                onChange={(e) =>
                  setEditedItems(prev => ({
                    ...prev,
                    [currentItem.itemId]: { ...currentEdited, description: e.target.value },
                  }))
                }
                placeholder="Add Poshmark-specific details..."
                rows={3}
                className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Right Panel: Progress (40%) */}
        <div className="flex flex-col gap-4">
          {/* Item List */}
          <div className="glass-panel rounded-xl border border-white/5 p-4 flex-1 overflow-y-auto">
            <h3 className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3">Items</h3>
            <div className="space-y-2">
              {items.map((item, idx) => {
                const state = itemStates[item.itemId];
                const isSelected = idx === selectedIndex;

                return (
                  <button
                    key={item.itemId}
                    onClick={() => !isProcessing && setSelectedIndex(idx)}
                    disabled={isProcessing}
                    className={cn(
                      'w-full p-3 rounded-lg border transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2',
                      isSelected
                        ? 'bg-blue-500/20 border-blue-500/30 '
                        : 'bg-white/5 border-white/10 hover:border-white/20',
                      state.status === 'success' && 'bg-emerald-500/10 border-emerald-500/20',
                      state.status === 'error' && 'bg-red-500/10 border-red-500/20'
                    )}
                  >
                    {/* Status Icon */}
                    {state.status === 'pending' && (
                      <div className="w-4 h-4 rounded-full bg-white/20" />
                    )}
                    {state.status === 'processing' && (
                      <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                    )}
                    {state.status === 'success' && (
                      <Check className="w-4 h-4 text-emerald-400" />
                    )}
                    {state.status === 'error' && (
                      <X className="w-4 h-4 text-red-400" />
                    )}

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{item.title}</p>
                      <p className="text-[10px] text-slate-500">
                        ${item.price}
                        {state.status === 'error' && ` — ${state.error}`}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Send Button */}
          <button
            onClick={handleSendToPoshmark}
            disabled={isProcessing || successCount === items.length}
            className={cn(
              'w-full py-3 rounded-lg font-medium transition-all text-white',
              isProcessing || successCount === items.length
                ? 'bg-slate-600 cursor-not-allowed opacity-50'
                : 'bg-violet-600 hover:bg-violet-500 shadow-lg shadow-violet-500/20'
            )}
          >
            {isProcessing ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </div>
            ) : successCount === items.length ? (
              <div className="flex items-center justify-center gap-2">
                <Check className="w-4 h-4" />
                All Complete
              </div>
            ) : (
              `Send to Poshmark (${items.length})`
            )}
          </button>

          {/* Success Message */}
          <AnimatePresence>
            {successCount === items.length && isProcessing === false && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg"
              >
                <p className="text-sm text-emerald-400 text-center font-medium">
                  ✓ Successfully crosslisted {successCount} items
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
