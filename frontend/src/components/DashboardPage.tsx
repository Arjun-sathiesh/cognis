import React from 'react';
import { 
  FolderKanban, 
  Files, 
  BrainCircuit, 
  Cpu, 
  Bug, 
  Lightbulb, 
  Code2, 
  Layers, 
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles
} from 'lucide-react';
import type { DashboardStats } from '../types';

interface DashboardPageProps {
  stats: DashboardStats | null;
  loading: boolean;
  onNavigate: (tab: string) => void;
  onViewKnowledge: (id: number) => void;
  onSeedSample: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  stats,
  loading,
  onNavigate,
  onViewKnowledge,
  onSeedSample,
}) => {
  if (loading || !stats) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-400">Loading Cognis organizational memory metrics...</p>
        </div>
      </div>
    );
  }

  const totals = stats.totals;

  const metricCards = [
    {
      title: 'Projects Ingested',
      value: totals.projects,
      sub: 'Active codebases',
      icon: FolderKanban,
      color: 'from-blue-500/20 to-blue-600/5',
      borderColor: 'border-blue-500/30',
      iconColor: 'text-blue-400',
      tab: 'projects'
    },
    {
      title: 'Documents Processed',
      value: totals.documents,
      sub: 'ADRs, Specs & Bug Reports',
      icon: Files,
      color: 'from-indigo-500/20 to-indigo-600/5',
      borderColor: 'border-indigo-500/30',
      iconColor: 'text-indigo-400',
      tab: 'projects'
    },
    {
      title: 'Total Knowledge Items',
      value: totals.knowledge_items,
      sub: 'Structured memory nodes',
      icon: BrainCircuit,
      color: 'from-purple-500/20 to-purple-600/5',
      borderColor: 'border-purple-500/30',
      iconColor: 'text-purple-400',
      tab: 'knowledge'
    },
    {
      title: 'Helpfulness Score',
      value: `${stats.feedback.helpfulness_rate}%`,
      sub: `${stats.feedback.total} total engineer reviews`,
      icon: TrendingUp,
      color: 'from-emerald-500/20 to-emerald-600/5',
      borderColor: 'border-emerald-500/30',
      iconColor: 'text-emerald-400',
      tab: 'feedback'
    }
  ];

  const categoryBreakdown = [
    { label: 'Architecture Decisions', count: totals.architecture, key: 'architecture', icon: Layers, color: 'bg-emerald-500', textColor: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10' },
    { label: 'Coding Standards', count: totals.standards, key: 'standards', icon: Code2, color: 'bg-blue-500', textColor: 'text-blue-400', border: 'border-blue-500/30', bg: 'bg-blue-500/10' },
    { label: 'Defect Patterns', count: totals.defects, key: 'defects', icon: Bug, color: 'bg-rose-500', textColor: 'text-rose-400', border: 'border-rose-500/30', bg: 'bg-rose-500/10' },
    { label: 'Lessons Learned', count: totals.lessons, key: 'lessons', icon: Lightbulb, color: 'bg-amber-500', textColor: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/10' },
    { label: 'Technologies & Stack', count: totals.technologies, key: 'technologies', icon: Cpu, color: 'bg-purple-500', textColor: 'text-purple-400', border: 'border-purple-500/30', bg: 'bg-purple-500/10' }
  ];

  const maxCategoryCount = Math.max(...categoryBreakdown.map(c => c.count), 1);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Banner if empty */}
      {totals.projects === 0 && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-[#0B0F19] border border-indigo-500/30 flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Welcome to Cognis MVP
            </h3>
            <p className="text-sm text-gray-300">
              No project data ingested yet. Load the sample "FinTrack" project to test the 14-step presentation workflow immediately!
            </p>
          </div>
          <button
            onClick={onSeedSample}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all active:scale-95 shrink-0"
          >
            Seed FinTrack Sample
          </button>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {metricCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              onClick={() => onNavigate(card.tab)}
              className={`p-5 rounded-xl bg-[#111827] border ${card.borderColor} bg-gradient-to-br ${card.color} glass-panel-hover cursor-pointer relative overflow-hidden`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-400">{card.title}</span>
                <div className={`p-2 rounded-lg bg-[#0B0F19]/60 ${card.iconColor}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-white tracking-tight">{card.value}</div>
              <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Distribution & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Knowledge Distribution */}
        <div className="lg:col-span-6 p-6 rounded-2xl bg-[#111827] border border-[#1F293D] space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white tracking-tight">Knowledge Distribution</h2>
              <p className="text-xs text-gray-400">Extracted organizational memory breakdown</p>
            </div>
            <button
              onClick={() => onNavigate('knowledge')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
            >
              <span>Explore All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            {categoryBreakdown.map((cat, i) => {
              const Icon = cat.icon;
              const percentage = Math.round((cat.count / maxCategoryCount) * 100);
              return (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className={`p-1 rounded ${cat.bg} ${cat.textColor}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-gray-300 font-medium">{cat.label}</span>
                    </div>
                    <span className="font-semibold text-white">{cat.count} items</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#1F293D] overflow-hidden">
                    <div
                      className={`h-full ${cat.color} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.max(percentage, 4)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick RAG Assistant CTA */}
          <div className="pt-2">
            <button
              onClick={() => onNavigate('assistant')}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-500 hover:to-purple-600 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.99]"
            >
              <Sparkles className="w-4 h-4" />
              <span>Query Memory with Cognis Assistant</span>
            </button>
          </div>
        </div>

        {/* Recent Knowledge Stream */}
        <div className="lg:col-span-6 p-6 rounded-2xl bg-[#111827] border border-[#1F293D] space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-white tracking-tight">Recent Organizational Knowledge</h2>
                <p className="text-xs text-gray-400">Latest extracted decisions & standards</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Clock className="w-3.5 h-3.5" />
                <span>Live Feed</span>
              </div>
            </div>

            <div className="space-y-3">
              {stats.recent_knowledge.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-400">
                  No knowledge items extracted yet. Upload project documents to begin.
                </div>
              ) : (
                stats.recent_knowledge.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onViewKnowledge(item.id)}
                    className="p-3 rounded-xl bg-[#0B0F19]/70 hover:bg-[#131B2E] border border-[#1F293D] transition-all cursor-pointer group flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1 overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
                          {item.category}
                        </span>
                        <h4 className="text-xs font-semibold text-gray-200 group-hover:text-indigo-300 transition-colors truncate">
                          {item.title}
                        </h4>
                      </div>
                      <p className="text-[11px] text-gray-400 line-clamp-1">
                        {item.content_snippet}
                      </p>
                    </div>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap font-mono">
                      {item.source}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => onNavigate('projects')}
              className="w-full py-2.5 px-4 rounded-xl bg-[#1F293D]/60 hover:bg-[#1F293D] text-gray-300 text-xs font-medium flex items-center justify-center gap-2 border border-[#374151]/50 transition-all"
            >
              <FolderKanban className="w-3.5 h-3.5" />
              <span>Manage Projects & Ingest Documents</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
