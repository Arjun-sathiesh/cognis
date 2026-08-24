import React from 'react';
import { X, FileText, Sparkles } from 'lucide-react';
import type { KnowledgeItem } from '../types';

interface KnowledgeDetailModalProps {
  item: KnowledgeItem | null;
  onClose: () => void;
  onAskAboutItem: (item: KnowledgeItem) => void;
}

export const KnowledgeDetailModal: React.FC<KnowledgeDetailModalProps> = ({
  item,
  onClose,
  onAskAboutItem
}) => {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#111827] border border-[#1F293D] rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#1F293D]/60 pb-4">
          <div>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
              {item.category}
            </span>
            <h3 className="text-lg font-bold text-white tracking-tight mt-1.5">{item.title}</h3>
            <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
              <FileText className="w-3.5 h-3.5" />
              <span>Source: <strong className="text-gray-300">{item.source}</strong></span>
            </div>
          </div>

          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs text-gray-300">
          <div className="space-y-1.5">
            <h4 className="font-semibold text-gray-200 uppercase tracking-wider text-[11px]">
              Extracted Knowledge / Decision
            </h4>
            <div className="p-4 rounded-xl bg-[#0B0F19] border border-[#1F293D] leading-relaxed whitespace-pre-line text-gray-300">
              {item.content}
            </div>
          </div>

          {item.rationale_or_solution && (
            <div className="space-y-1.5">
              <h4 className="font-semibold text-gray-200 uppercase tracking-wider text-[11px]">
                {item.category === 'defects'
                  ? 'Root Cause & Fix'
                  : item.category === 'lessons'
                  ? 'Engineering Recommendation'
                  : item.category === 'standards'
                  ? 'Explanation & Enforcement'
                  : 'Architectural Tradeoffs & Rationale'}
              </h4>
              <div className="p-4 rounded-xl bg-[#0B0F19] border border-[#1F293D] leading-relaxed whitespace-pre-line text-indigo-200">
                {item.rationale_or_solution}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#1F293D]/60 pt-4 flex items-center justify-between">
          <span className="text-[11px] text-gray-400">
            Node ID: #{item.id} • Verified in repository
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onAskAboutItem(item);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Query in Assistant</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
