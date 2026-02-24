import React, { useState, useRef } from 'react';
import {
  Upload, X, FileText, Loader2, Sparkles,
  Copy, RefreshCw, Minus, Plus, LayoutList, Tag, TrendingUp, Shield,
  Image as ImageIcon, CheckCircle2, Zap, AlertCircle, DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'listing' | 'mylistings' | 'specifics' | 'market' | 'policies';

interface AnalysisResult {
  title: string;
  description: string;
  suggestedPrice: number;
  categoryId: string;
  condition: string;
  conditionDescription?: string;
  itemSpecifics: Record<string, string>;
  // Market data (from eBay sold listings)
  pricingSource?: string;
  salesSampled?: number;
  priceRange?: string;
  priceMin?: number;
  priceMax?: number;
  priceAvg?: number;
  topKeywords?: string[];
  conditionBreakdown?: Record<string, number>;
  // Computed price tiers
  priceQuick?: number;
  priceModerate?: number;
  priceHigh?: number;
}

interface ActiveListing {
  itemId: string;
  title: string;
  price: string;
  watchCount: string | number;
  bids: string | number;
  startTime: string | null;
  imageUrl?: string;
  listingUrl: string;
}

export function VisionUplinkPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('listing');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [context, setContext] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<'quick' | 'moderate' | 'high'>('moderate');

  // My Listings tab state
  const [listings, setListings] = useState<ActiveListing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [listingsLoaded, setListingsLoaded] = useState(false);
  const [listingsError, setListingsError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Derived values from analysis
  const title = analysisResult?.title ?? '';
  const description = analysisResult?.description ?? '';
  const setTitle = (v: string) => setAnalysisResult(r => r ? { ...r, title: v } : r);
  const setDescription = (v: string) => setAnalysisResult(r => r ? { ...r, description: v } : r);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files?.length) {
      setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)].slice(0, 12));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)].slice(0, 12));
    }
  };

  const removeFile = (index: number) => setFiles(prev => prev.filter((_, i) => i !== index));

  // ── Core: Analyze image via backend ──────────────────────────────────────
  const handleAnalyze = async () => {
    if (files.length === 0) return;
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      // Convert first image to base64 data URL
      const file = files[0];
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64,
          userPrompt: context || undefined,
        }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        const d = data.data;
        const basePrice = parseFloat(d.suggestedPrice) || 0;
        setAnalysisResult({
          ...d,
          priceQuick: parseFloat((basePrice * 0.85).toFixed(2)),
          priceModerate: parseFloat(basePrice.toFixed(2)),
          priceHigh: parseFloat((basePrice * 1.2).toFixed(2)),
        });
        setActiveTab('listing');
      } else {
        setAnalysisError(data.error || 'Analysis failed — try again');
      }
    } catch (err: any) {
      setAnalysisError(`Connection error: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ── Load active eBay listings ──────────────────────────────────────────────
  const loadListings = async () => {
    setListingsLoading(true);
    setListingsError(null);
    try {
      const r = await fetch('/api/active-listings');
      const d = await r.json();
      if (d.success) {
        setListings(d.items || []);
        setListingsLoaded(true);
      } else {
        setListingsError(d.error || 'Could not load listings');
      }
    } catch (err: any) {
      setListingsError(`Connection error: ${err.message}`);
    } finally {
      setListingsLoading(false);
    }
  };

  // ── Repull specifics from title ────────────────────────────────────────────
  const handleRepullSpecifics = async () => {
    if (!title) return;
    setIsAnalyzing(true);
    try {
      const r = await fetch('/api/repull-specifics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, categoryId: analysisResult?.categoryId }),
      });
      const d = await r.json();
      if (d.success && d.itemSpecifics) {
        setAnalysisResult(prev => prev ? { ...prev, itemSpecifics: d.itemSpecifics } : prev);
      }
    } catch {}
    finally { setIsAnalyzing(false); }
  };

  // ── Check eBay sales for current title ────────────────────────────────────
  const handleRepriceFromTitle = async () => {
    if (!title) return;
    setIsAnalyzing(true);
    try {
      const r = await fetch('/api/reprice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      const d = await r.json();
      if (d.success) {
        const p = parseFloat(d.suggestedPrice);
        setAnalysisResult(prev => prev ? {
          ...prev,
          suggestedPrice: p,
          priceQuick: parseFloat((p * 0.85).toFixed(2)),
          priceModerate: p,
          priceHigh: parseFloat((p * 1.2).toFixed(2)),
          pricingSource: 'ebay_sold_listings',
          salesSampled: d.salesSampled,
          priceRange: d.priceRange,
          priceAvg: d.priceAvg,
          topKeywords: d.topKeywords,
        } : prev);
      }
    } catch {}
    finally { setIsAnalyzing(false); }
  };

  // ── Publish listing ────────────────────────────────────────────────────────
  const handlePublish = async () => {
    if (!analysisResult) return;
    setIsAnalyzing(true);
    try {
      const images = await Promise.all(
        files.map(f => new Promise<string>((res, rej) => {
          const reader = new FileReader();
          reader.onload = () => res(reader.result as string);
          reader.onerror = rej;
          reader.readAsDataURL(f);
        }))
      );
      const r = await fetch('/api/publish-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...analysisResult,
          price: analysisResult.suggestedPrice,
          images,
        }),
      });
      const d = await r.json();
      if (d.success) {
        alert(`✅ Listed! Item ID: ${d.itemId}\n${d.listingUrl}`);
      } else {
        alert(`❌ Publish failed: ${d.errors?.join(', ') || d.error}`);
      }
    } catch (err: any) {
      alert(`Connection error: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getActivePrice = () => {
    if (!analysisResult) return '0.00';
    if (selectedStrategy === 'quick') return (analysisResult.priceQuick ?? 0).toFixed(2);
    if (selectedStrategy === 'high') return (analysisResult.priceHigh ?? 0).toFixed(2);
    return (analysisResult.priceModerate ?? 0).toFixed(2);
  };

  return (
    <div className="max-w-[1600px] mx-auto p-6 h-[calc(100vh-4rem)] flex gap-6">
      {/* ── Left Sidebar: Media Manager ─────────────────────────────────────── */}
      <div className="w-80 flex flex-col gap-4 shrink-0">
        <div className="glass-panel rounded-xl p-4 border border-white/10 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-4 text-slate-300 font-semibold">
            <ImageIcon className="w-5 h-5" />
            <span>MEDIA MANAGER</span>
          </div>

          {/* Upload Zone */}
          <div
            className="border-2 border-dashed border-white/10 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/5 hover:border-white/20 transition-all mb-4"
            onClick={() => inputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
          >
            <input ref={inputRef} type="file" multiple className="hidden" onChange={handleChange} accept="image/*" />
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mb-2">
              <Upload className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-sm font-medium text-white">Click to upload</span>
            <span className="text-xs text-slate-500 mt-1">JPG, PNG up to 12 images</span>
          </div>

          {/* Image Thumbnails */}
          <div className="flex-1 overflow-y-auto min-h-0 pr-1">
            {files.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {files.map((file, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-white/10 group">
                    <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                    {i === 0 && (
                      <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-blue-600 text-[9px] font-bold text-white rounded uppercase">
                        Main
                      </div>
                    )}
                    <button
                      onClick={() => removeFile(i)}
                      className="absolute top-1 right-1 p-1 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-600 text-xs italic">No images uploaded yet</div>
            )}
          </div>

          {/* Contextual Info */}
          <div className="mt-4 pt-4 border-t border-white/5">
            <div className="flex items-center gap-2 mb-2 text-slate-300 text-sm font-medium">
              <FileText className="w-4 h-4" />
              <span>Contextual Info</span>
            </div>
            <textarea
              value={context}
              onChange={e => setContext(e.target.value)}
              placeholder="Condition notes, accessories, serial numbers..."
              className="w-full h-20 bg-[#0B0E14] border border-white/10 rounded-lg p-3 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 resize-none"
            />
          </div>

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={files.length === 0 || isAnalyzing}
            className={cn(
              "mt-4 w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all",
              files.length === 0
                ? "bg-white/5 text-slate-600 cursor-not-allowed"
                : isAnalyzing
                  ? "bg-blue-900/50 text-blue-300 cursor-wait"
                  : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/30"
            )}
          >
            {isAnalyzing ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing…</>
            ) : (
              <><Zap className="w-4 h-4" /> Initiate Analysis</>
            )}
          </button>

          {analysisError && (
            <div className="mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-400">{analysisError}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Right Content: Tabs ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Tab Navigation */}
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg mb-6 w-fit border border-white/5">
          {[
            { id: 'listing', label: 'Listing', icon: FileText },
            { id: 'mylistings', label: 'My Listings', icon: LayoutList },
            { id: 'specifics', label: 'Specifics', icon: Tag },
            { id: 'market', label: 'Market', icon: TrendingUp },
            { id: 'policies', label: 'Policies', icon: Shield },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as Tab);
                if (tab.id === 'mylistings' && !listingsLoaded) loadListings();
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 glass-panel rounded-xl border border-white/10 p-8 overflow-y-auto">

          {/* ── LISTING TAB ────────────────────────────────────────────────── */}
          {activeTab === 'listing' && (
            <div className="max-w-4xl space-y-8">
              {!analysisResult && !isAnalyzing && (
                <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                  <Sparkles className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-sm">Upload an image and click <strong className="text-slate-400">Initiate Analysis</strong> to generate a listing</p>
                </div>
              )}

              {analysisResult && (
                <>
                  {/* Title */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-slate-300">Product Title</label>
                      <span className={cn("text-xs font-mono", title.length > 80 ? "text-red-400" : "text-slate-500")}>
                        {title.length}/80
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="flex-1 bg-[#0B0E14] border border-white/10 rounded-lg px-4 py-3 text-lg text-white focus:outline-none focus:border-blue-500/50 transition-all font-medium"
                      />
                      <button
                        onClick={() => navigator.clipboard.writeText(title)}
                        className="p-3 bg-white/5 border border-white/10 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                        title="Copy title"
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* AI Description */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-slate-300">AI Description</label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigator.clipboard.writeText(description)}
                          className="p-2 bg-white/5 border border-white/10 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                          title="Copy description"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="bg-[#0B0E14] border border-white/10 rounded-xl p-6 min-h-[300px]">
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={e => setDescription(e.currentTarget.innerHTML)}
                        dangerouslySetInnerHTML={{ __html: description }}
                        className="w-full min-h-[280px] bg-transparent border-none focus:outline-none text-slate-300 leading-relaxed prose prose-invert prose-sm max-w-none"
                      />
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="flex items-center justify-end gap-4 pt-4 border-t border-white/5">
                    <button className="px-6 py-2 text-slate-400 hover:text-white font-medium transition-colors">
                      Save Draft
                    </button>
                    <button
                      onClick={handlePublish}
                      disabled={isAnalyzing}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Publish to eBay
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── MY LISTINGS TAB ────────────────────────────────────────────── */}
          {activeTab === 'mylistings' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Active eBay Listings</h3>
                <button
                  onClick={loadListings}
                  disabled={listingsLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 rounded-lg text-sm font-medium transition-all"
                >
                  {listingsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  {listingsLoaded ? 'Refresh' : 'Pull from eBay'}
                </button>
              </div>

              {listingsError && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <p className="text-sm text-red-400">{listingsError}</p>
                </div>
              )}

              {!listingsLoaded && !listingsLoading && !listingsError && (
                <div className="flex flex-col items-center justify-center h-48 text-slate-500">
                  <LayoutList className="w-10 h-10 mb-3 opacity-20" />
                  <p className="text-sm">Click "Pull from eBay" to load your active listings</p>
                </div>
              )}

              {listingsLoading && (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                </div>
              )}

              {listingsLoaded && listings.length === 0 && (
                <div className="text-center py-12 text-slate-500 text-sm">No active listings found</div>
              )}

              {listings.map(item => {
                const daysActive = item.startTime
                  ? Math.floor((Date.now() - new Date(item.startTime).getTime()) / 86400000)
                  : null;
                return (
                  <div key={item.itemId} className="flex gap-4 p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0 bg-white/5" />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                        <ImageIcon className="w-6 h-6 text-slate-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{item.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">ID: {item.itemId}</p>
                      <div className="flex gap-4 mt-2">
                        <span className="text-sm font-bold text-blue-400">${item.price}</span>
                        <span className="text-xs text-slate-400">{item.watchCount} watchers</span>
                        {Number(item.bids) > 0 && <span className="text-xs text-amber-400">{item.bids} bids</span>}
                        {daysActive !== null && <span className="text-xs text-slate-500">{daysActive}d active</span>}
                      </div>
                    </div>
                    <a
                      href={item.listingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white text-xs rounded-lg transition-colors self-center"
                    >
                      View
                    </a>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── SPECIFICS TAB ──────────────────────────────────────────────── */}
          {activeTab === 'specifics' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Item Specifics</h3>
                {analysisResult && (
                  <button
                    onClick={handleRepullSpecifics}
                    disabled={isAnalyzing}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white rounded-lg text-sm font-medium transition-all"
                  >
                    {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    Repull from Title
                  </button>
                )}
              </div>

              {!analysisResult ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-500">
                  <Tag className="w-10 h-10 mb-3 opacity-20" />
                  <p className="text-sm">Analyze an image first to generate item specifics</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(analysisResult.itemSpecifics || {}).map(([key, value]) => (
                    <div key={key} className="p-3 bg-white/5 rounded-lg border border-white/5">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{key}</p>
                      <p
                        contentEditable
                        suppressContentEditableWarning
                        className="text-sm font-medium text-white focus:outline-none focus:text-blue-300"
                        onBlur={e => {
                          setAnalysisResult(r => r ? {
                            ...r,
                            itemSpecifics: { ...r.itemSpecifics, [key]: e.currentTarget.textContent || '' }
                          } : r);
                        }}
                      >
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── MARKET TAB ─────────────────────────────────────────────────── */}
          {activeTab === 'market' && (
            <div className="space-y-6 max-w-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Market Pricing</h3>
                <button
                  onClick={handleRepriceFromTitle}
                  disabled={!analysisResult || isAnalyzing}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
                >
                  {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Check eBay Sales
                </button>
              </div>

              {/* Price Strategy Cards */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: 'quick', label: 'Quick Sale', sub: '15% under market', price: analysisResult?.priceQuick, color: 'amber' },
                  { id: 'moderate', label: 'Market', sub: 'Fair value', price: analysisResult?.priceModerate, color: 'blue' },
                  { id: 'high', label: 'Premium', sub: '20% over market', price: analysisResult?.priceHigh, color: 'emerald' },
                ].map(card => (
                  <button
                    key={card.id}
                    onClick={() => setSelectedStrategy(card.id as any)}
                    className={cn(
                      "p-4 rounded-xl border-2 text-center transition-all",
                      selectedStrategy === card.id
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    )}
                  >
                    <p className="text-xs text-slate-400 uppercase font-bold mb-1">{card.label}</p>
                    <p className="text-2xl font-black text-white mb-1">
                      {card.price != null ? `$${card.price.toFixed(2)}` : '$--'}
                    </p>
                    <p className="text-[10px] text-slate-500">{card.sub}</p>
                  </button>
                ))}
              </div>

              {/* Active Price Display */}
              <div className="p-4 bg-[#0B0E14] border border-white/10 rounded-xl flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-blue-400" />
                <span className="text-slate-400 text-sm">Active List Price</span>
                <span className="text-2xl font-black text-blue-400 ml-auto">${getActivePrice()}</span>
              </div>

              {/* Market Stats */}
              {analysisResult?.pricingSource === 'ebay_sold_listings' && (
                <div className="p-4 bg-white/5 border border-white/5 rounded-xl space-y-2 text-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">eBay Sold Data</p>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Sales Sampled</span>
                    <span className="font-bold text-white">{analysisResult.salesSampled} sold</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Price Range</span>
                    <span className="font-bold text-white">{analysisResult.priceRange}</span>
                  </div>
                  {analysisResult.priceAvg != null && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Market Avg</span>
                      <span className="font-bold text-white">${analysisResult.priceAvg.toFixed(2)}</span>
                    </div>
                  )}
                  {analysisResult.topKeywords && analysisResult.topKeywords.length > 0 && (
                    <div className="pt-2 border-t border-white/5">
                      <p className="text-xs text-slate-500 mb-1">Keywords in sold listings</p>
                      <div className="flex flex-wrap gap-1">
                        {analysisResult.topKeywords.map(kw => (
                          <span key={kw} className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] rounded-full">{kw}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!analysisResult && (
                <div className="flex flex-col items-center justify-center h-48 text-slate-500">
                  <TrendingUp className="w-10 h-10 mb-3 opacity-20" />
                  <p className="text-sm">Analyze an image first to see market pricing</p>
                </div>
              )}
            </div>
          )}

          {/* ── POLICIES TAB ───────────────────────────────────────────────── */}
          {activeTab === 'policies' && (
            <div className="space-y-6 max-w-2xl">
              <h3 className="text-lg font-semibold text-white">Listing Policies</h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Category ID</p>
                  <p className="text-sm font-medium text-white">{analysisResult?.categoryId || '—'}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Condition ID</p>
                  <p className="text-sm font-medium text-white">{analysisResult?.condition || '—'}</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Preset Policies</p>
                {[
                  { label: 'Shipping', value: 'FREE USPS Ground Advantage' },
                  { label: 'Returns', value: '30-Day Money Back' },
                  { label: 'Handling', value: '3 Business Days' },
                  { label: 'Location', value: 'Belen, New Mexico' },
                  { label: 'Payment', value: 'eBay Managed Payments' },
                ].map(p => (
                  <div key={p.label} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                    <span className="text-xs text-slate-400">{p.label}</span>
                    <span className="text-xs font-medium text-white">{p.value}</span>
                  </div>
                ))}
              </div>

              {analysisResult?.conditionDescription && (
                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Condition Notes</p>
                  <p className="text-sm text-slate-300 leading-relaxed">{analysisResult.conditionDescription}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
