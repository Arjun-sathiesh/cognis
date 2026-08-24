import React from 'react';
import { Sparkles, RefreshCw, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onSeedSample: () => void;
  isSeeding?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  title, 
  subtitle, 
  onSeedSample,
  isSeeding 
}) => {
  return (
    <header className="h-16 border-b border-[#1F293D]/70 bg-[#0B0F19]/90 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
      <div>
        <h1 className="text-base font-semibold text-white tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-gray-400 font-normal">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onSeedSample}
          disabled={isSeeding}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition-all shadow-sm active:scale-95 disabled:opacity-50"
          title="Reload the sample FinTrack engineering project and documents"
        >
          {isSeeding ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          )}
          <span>{isSeeding ? 'Seeding...' : 'Load Sample FinTrack'}</span>
        </button>

        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#111827] border border-[#1F293D] text-[11px] text-gray-300">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span>Cognis RAG Engine Active</span>
        </div>
      </div>
    </header>
  );
};
