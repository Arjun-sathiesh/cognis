import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Search, 
  SearchX,
  Layers, 
  Code2, 
  Bug, 
  Lightbulb, 
  Cpu, 
  ExternalLink,
  BookOpen,
  FileText,
  Sparkles,
  X,
  FolderKanban,
  Loader2,
  RotateCcw,
  PlusCircle
} from 'lucide-react';
import type { KnowledgeItem, KnowledgeCategory, Project } from '../types';
import { api } from '../api/client';

interface KnowledgeBasePageProps {
  onInspectItem: (item: KnowledgeItem) => void;
  onAskAboutItem: (item: KnowledgeItem) => void;
  onSeedSample?: () => void;
}

export const KnowledgeBasePage: React.FC<KnowledgeBasePageProps> = ({
  onInspectItem,
  onAskAboutItem,
  onSeedSample
}) => {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [allUnfilteredItems, setAllUnfilteredItems] = useState<KnowledgeItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Load projects list for project-based filtering
  useEffect(() => {
    api.getProjects()
      .then(setProjects)
      .catch((err) => console.error('Failed to load projects for filter:', err));
  }, []);

  // Fetch knowledge items when filters change
  const loadKnowledge = useCallback(async () => {
    try {
      setLoading(true);
      const projectIdNum = selectedProject !== 'all' ? parseInt(selectedProject, 10) : undefined;
      
      // Fetch filtered list
      const data = await api.getKnowledge(projectIdNum, selectedCategory, searchQuery);
      setItems(data);

      // Also fetch total/unfiltered list for accurate category badge counters
      if (selectedCategory === 'all' && !searchQuery.trim()) {
        setAllUnfilteredItems(data);
      } else {
        const fullData = await api.getKnowledge(projectIdNum, 'all', '');
        setAllUnfilteredItems(fullData);
      }
    } catch (err) {
      console.error('Failed to load knowledge base:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedProject, selectedCategory, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadKnowledge();
    }, 150);
    return () => clearTimeout(timer);
  }, [loadKnowledge]);

  // Keyboard shortcut: Esc clears search query
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && searchQuery) {
        setSearchQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery]);

  const categories = [
    { id: 'all', label: 'All Knowledge', icon: BookOpen },
    { id: 'architecture', label: 'Architecture', icon: Layers },
    { id: 'standards', label: 'Coding Standards', icon: Code2 },
    { id: 'defects', label: 'Defects & Bugs', icon: Bug },
    { id: 'lessons', label: 'Lessons Learned', icon: Lightbulb },
    { id: 'technologies', label: 'Technologies', icon: Cpu },
  ];

  // Calculate live item counts per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allUnfilteredItems.length };
    for (const item of allUnfilteredItems) {
      counts[item.category] = (counts[item.category] || 0) + 1;
    }
    return counts;
  }, [allUnfilteredItems]);

  const resetAllFilters = () => {
    setSelectedCategory('all');
    setSelectedProject('all');
    setSearchQuery('');
  };

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

  // Highlight search matches in text
  const renderHighlightedText = (text: string, query: string) => {
    if (!query.trim() || !text) return text;
    const words = query.trim().split(/\s+/).filter(Boolean).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    if (!words.length) return text;

    const regex = new RegExp(`(${words.join('|')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-indigo-500/30 text-indigo-200 px-0.5 rounded font-semibold">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const hasActiveFilters = searchQuery.trim() !== '' || selectedCategory !== 'all' || selectedProject !== 'all';
  const selectedProjectName = projects.find(p => p.id.toString() === selectedProject)?.name;

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Organizational Knowledge Base</h2>
            {items.length > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">Searchable engineering repository extracted from project specifications</p>
        </div>

        {/* Filters & Search Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Project Dropdown Filter */}
          {projects.length > 0 && (
            <div className="relative">
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="pl-8 pr-7 py-2 rounded-xl bg-[#111827] border border-[#1F293D] text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer appearance-none"
              >
                <option value="all">All Projects</option>
                {projects.map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    {proj.name} ({proj.knowledge_count})
                  </option>
                ))}
              </select>
              <FolderKanban className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] text-gray-400">▼</div>
            </div>
          )}

          {/* Search Input Bar */}
          <div className="relative flex-1 md:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search title, rationale, source (e.g. JWT, SQL)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-8 py-2 rounded-xl bg-[#111827] border border-[#1F293D] text-white text-xs placeholder:text-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 text-indigo-400 absolute right-3 top-1/2 -translate-y-1/2 animate-spin" />
            ) : searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                title="Clear search (Esc)"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-white rounded-full hover:bg-gray-800 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Category Filter Tabs with Live Item Counters */}
      <div className="flex items-center justify-between border-b border-[#1F293D]/60 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.id;
            const count = categoryCounts[cat.id] || 0;
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
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isActive ? 'bg-indigo-500/30 text-indigo-200' : 'bg-gray-800 text-gray-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Reset Active Filters pill button */}
        {hasActiveFilters && (
          <button
            onClick={resetAllFilters}
            className="hidden sm:flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all whitespace-nowrap"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* Active Filter Summary Bar */}
      {hasActiveFilters && items.length > 0 && (
        <div className="flex items-center justify-between text-xs bg-[#111827]/60 border border-[#1F293D] px-3.5 py-2 rounded-xl text-gray-400">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-300">Active filters:</span>
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
                Search: "{searchQuery}"
                <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => setSearchQuery('')} />
              </span>
            )}
            {selectedCategory !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 capitalize">
                Category: {selectedCategory}
                <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => setSelectedCategory('all')} />
              </span>
            )}
            {selectedProject !== 'all' && selectedProjectName && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
                Project: {selectedProjectName}
                <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => setSelectedProject('all')} />
              </span>
            )}
          </div>
          <button
            onClick={resetAllFilters}
            className="text-[11px] text-gray-400 hover:text-white underline ml-2"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Knowledge Cards Grid or Context-Aware Empty State */}
      {loading ? (
        <div className="p-16 text-center text-xs text-gray-400 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
          <span>Searching knowledge repository...</span>
        </div>
      ) : items.length === 0 ? (
        /* Better Empty Result Messages */
        allUnfilteredItems.length === 0 && selectedProject === 'all' ? (
          /* Empty Database State */
          <div className="p-12 rounded-2xl bg-[#111827] border border-[#1F293D] text-center space-y-4 max-w-xl mx-auto my-6">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-white">Knowledge Base is Empty</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                No knowledge items have been extracted yet. Upload engineering documents in the Projects page and trigger analysis, or load the FinTrack sample project.
              </p>
            </div>
            {onSeedSample && (
              <button
                onClick={onSeedSample}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Seed Sample FinTrack Project</span>
              </button>
            )}
          </div>
        ) : searchQuery.trim() !== '' ? (
          /* Search Query Empty State */
          <div className="p-12 rounded-2xl bg-[#111827] border border-[#1F293D] text-center space-y-4 max-w-xl mx-auto my-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
              <SearchX className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-white">
                No matches found for "{searchQuery}"
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                We couldn't find any knowledge items matching your query
                {selectedCategory !== 'all' ? ` within the ${selectedCategory} category` : ''}
                {selectedProject !== 'all' && selectedProjectName ? ` in project ${selectedProjectName}` : ''}.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setSearchQuery('')}
                className="px-3.5 py-1.5 rounded-xl bg-[#1F293D] hover:bg-gray-700 text-white text-xs font-medium transition-all"
              >
                Clear Search Term
              </button>
              <button
                onClick={resetAllFilters}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all"
              >
                Reset All Filters
              </button>
            </div>
          </div>
        ) : (
          /* Category/Project Filter Empty State */
          <div className="p-12 rounded-2xl bg-[#111827] border border-[#1F293D] text-center space-y-4 max-w-xl mx-auto my-6">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
              <Layers className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-white">
                No items in {selectedCategory !== 'all' ? `"${selectedCategory}"` : 'selected filter'}
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                There are no knowledge records for this specific category
                {selectedProjectName ? ` under ${selectedProjectName}` : ''}.
              </p>
            </div>
            <button
              onClick={resetAllFilters}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Show All Knowledge</span>
            </button>
          </div>
        )
      ) : (
        /* Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => onInspectItem(item)}
              className="p-5 rounded-2xl bg-[#111827] border border-[#1F293D] glass-panel-hover cursor-pointer flex flex-col justify-between space-y-4 group relative hover:border-indigo-500/50 transition-all"
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
                  {renderHighlightedText(item.title, searchQuery)}
                </h3>

                <p className="text-xs text-gray-300 line-clamp-3 leading-relaxed whitespace-pre-line">
                  {renderHighlightedText(item.content, searchQuery)}
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
                    <p className="line-clamp-2">
                      {renderHighlightedText(item.rationale_or_solution, searchQuery)}
                    </p>
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

export default KnowledgeBasePage;

