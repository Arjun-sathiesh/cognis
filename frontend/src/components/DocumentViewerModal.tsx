import React, { useState, useEffect } from 'react';
import { X, FileText } from 'lucide-react';
import { api } from '../api/client';

interface DocumentViewerModalProps {
  documentId: number | null;
  onClose: () => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  documentId,
  onClose
}) => {
  const [docData, setDocData] = useState<{ id: number; filename: string; file_type: string; content: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!documentId) return;
    setLoading(true);
    api.getDocumentContent(documentId)
      .then(setDocData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [documentId]);

  if (!documentId) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-[#111827] border border-[#1F293D] rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1F293D]/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">{docData?.filename || 'Document Content'}</h3>
              <p className="text-[11px] text-gray-400 font-mono">{docData?.file_type}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Viewer */}
        <div className="flex-1 overflow-y-auto pr-1">
          {loading ? (
            <div className="p-12 text-center text-xs text-gray-400">Loading document text...</div>
          ) : (
            <pre className="p-4 rounded-xl bg-[#0B0F19] border border-[#1F293D] text-xs font-mono text-gray-300 leading-relaxed whitespace-pre-wrap select-text">
              {docData?.content}
            </pre>
          )}
        </div>

        <div className="border-t border-[#1F293D]/60 pt-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#1F293D] hover:bg-[#374151] text-xs text-white font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
