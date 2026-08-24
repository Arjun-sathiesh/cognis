import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Layers, 
  Code2, 
  Bug, 
  Lightbulb, 
  Cpu, 
  ExternalLink,
  BookOpen,
  FileText,
  Sparkles
} from 'lucide-react';
import type { KnowledgeItem, KnowledgeCategory } from '../types';
import { api } from '../api/client';

interface KnowledgeBasePageProps {
  onInspectItem: (item: KnowledgeItem) => void;
  onAskAboutItem: (item: KnowledgeItem) => void;
}

export const KnowledgeBasePage: React.FC<KnowledgeBasePageProps> = ({
  onInspectItem,
  onAskAboutItem
}) => {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadKnowledge = async () => {
    try {
      setLoading(true);
      const data = await api.getKnowledge(undefined, selectedCategory, searchQuery);
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadKnowledge();
    }, 150);
    return () => clearTimeout(timer);
  }, [selectedCategory, searchQuery]);

  const categories = [
    { id: 'all', label: 'All Knowledge', icon: BookOpen },
    { id: 'architecture', label: 'Architecture', icon: Layers },
    { id: 'standards', label: 'Coding Standards', icon: Code2 },
    { id: 'defects', label: 'Defects & Bugs', icon: Bug },
    { id: 'lessons', label: 'Lessons Learned', icon: Lightbulb },
    { id: 'technologies', label: 'Technologies', icon: Cpu },
  ];

  const getCategoryBadge = (cat: KnowledgeCategory) => {
    switch (cat) {
      case 'architecture':
        return <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">Architecture</span>;
      case 'standards':
        return <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20">Standard</span>;
      case 'defects':
        return <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/20">Defect Pattern</span>;
      case 'lessons':
        return <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">Lesson Learned</span>;
      case 'technologies':
        return <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/20">Technology</span>;
      default:
        return <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-gray-500/15 text-gray-300 border border-gray-500/20">{cat}</span>;
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Organizational Knowledge Base</h2>
          <p className="text-xs text-gray-400">Searchable engineering repository extracted from project specifications</p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search knowledge (e.g. authentication)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#111827] border border-[#1F293D] text-white text-xs placeholder:text-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#1F293D]/60">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/40 shadow-sm shadow-indigo-500/10'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-[#111827]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Knowledge Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-gray-400">Loading knowledge items...</div>
      ) : items.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#111827] border border-[#1F293D] text-center space-y-3">
          <BookOpen className="w-8 h-8 text-gray-400 mx-auto" />
          <p className="text-sm text-gray-300">No knowledge items match your search or filter.</p>
          <p className="text-xs text-gray-400">Try searching for keywords like "PostgreSQL", "JWT", or "Lock".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => onInspectItem(item)}
              className="p-5 rounded-2xl bg-[#111827] border border-[#1F293D] glass-panel-hover cursor-pointer flex flex-col justify-between space-y-4 group relative"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  {getCategoryBadge(item.category)}
                  <span className="text-[11px] text-gray-400 font-mono flex items-center gap-1">
                    <FileText className="w-3 h-3 text-gray-400" />
                    {item.source}
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors line-clamp-2">
                  {item.title}
                </h3>

                <p className="text-xs text-gray-300 line-clamp-3 leading-relaxed whitespace-pre-line">
                  {item.content}
                </p>

                {item.rationale_or_solution && (
                  <div className="p-2.5 rounded-lg bg-[#0B0F19]/80 border border-[#1F293D]/60 text-[11px] text-gray-400 space-y-1">
                    <span className="font-semibold text-gray-300 block">
                      {item.category === 'defects'
                        ? 'Resolution / Fix:'
                        : item.category === 'lessons'
                        ? 'Recommendation:'
                        : item.category === 'standards'
                        ? 'Explanation:'
                        : 'Rationale:'}
                    </span>
                    <p className="line-clamp-2">{item.rationale_or_solution}</p>
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-[#1F293D]/60 flex items-center justify-between">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAskAboutItem(item);
                  }}
                  className="flex items-center gap-1.5 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Ask Cognis</span>
                </button>

                <span className="text-[11px] text-gray-400 flex items-center gap-1 group-hover:text-white transition-colors">
                  <span>Inspect</span>
                  <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
