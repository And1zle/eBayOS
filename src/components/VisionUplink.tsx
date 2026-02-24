import React, { useState, useRef } from 'react';
import { Upload, ScanEye, X, Image as ImageIcon, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VisionUplinkProps {
  onNavigate: () => void;
}

export function VisionUplink({ onNavigate }: VisionUplinkProps) {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [context, setContext] = useState('');

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (newFiles: File[]) => {
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    // Navigate to full page
    onNavigate();
  };

  return (
    <div className="glass-panel rounded-xl p-6 border border-white/5 flex flex-col h-full relative overflow-hidden group">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <ScanEye className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white tracking-tight">Vision Uplink</h3>
          <p className="text-xs text-slate-500">Digitize physical inventory</p>
        </div>
      </div>

      {/* Drop Zone */}
      <div 
        className={cn(
          "relative flex-1 min-h-[160px] rounded-xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center p-4 text-center cursor-pointer group/drop",
          dragActive 
            ? "border-blue-500 bg-blue-500/10" 
            : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input 
          ref={inputRef}
          type="file" 
          multiple 
          className="hidden" 
          onChange={handleChange} 
          accept="image/*"
        />
        
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-blue-500/5 opacity-0 group-hover/drop:opacity-100 transition-opacity rounded-xl pointer-events-none" />

        {files.length === 0 ? (
          <>
            <div className="w-12 h-12 rounded-full bg-[#0B0E14] border border-white/10 flex items-center justify-center mb-3 shadow-xl group-hover/drop:scale-110 transition-transform">
              <Upload className="w-5 h-5 text-slate-400 group-hover/drop:text-blue-400 transition-colors" />
            </div>
            <p className="text-sm font-medium text-slate-300">
              Drop visuals here
            </p>
            <p className="text-xs text-slate-500 mt-1">
              or click to browse feed
            </p>
          </>
        ) : (
          <div className="w-full grid grid-cols-3 gap-2">
            {files.slice(0, 6).map((file, i) => (
              <div key={i} className="relative aspect-square rounded-lg bg-[#0B0E14] border border-white/10 overflow-hidden group/file">
                <img 
                  src={URL.createObjectURL(file)} 
                  alt="preview" 
                  className="w-full h-full object-cover opacity-70 group-hover/file:opacity-100 transition-opacity" 
                />
                <button 
                  onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                  className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover/file:opacity-100 transition-opacity hover:bg-red-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {files.length > 6 && (
              <div className="aspect-square rounded-lg bg-[#0B0E14] border border-white/10 flex items-center justify-center text-xs text-slate-500">
                +{files.length - 6}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Context Input */}
      <div className="mt-4 space-y-3">
        <div className="relative">
          <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
          <textarea 
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Add context (condition, serial #, flaws)..."
            className="w-full bg-[#0B0E14] border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all resize-none h-20"
          />
        </div>

        <button 
          onClick={handleAnalyze}
          disabled={files.length === 0 || isAnalyzing}
          className={cn(
            "w-full py-2.5 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2",
            files.length > 0 
              ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20" 
              : "bg-white/5 text-slate-500 cursor-not-allowed"
          )}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Scanning Matter...
            </>
          ) : (
            <>
              <ScanEye className="w-4 h-4" />
              Initiate Analysis
            </>
          )}
        </button>
      </div>
    </div>
  );
}
