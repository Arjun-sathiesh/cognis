import React from 'react';
import { 
  LayoutDashboard, 
  FolderKanban, 
  BookOpen, 
  Bot, 
  MessageSquareHeart, 
  Settings, 
  Sparkles, 
  BrainCircuit,
  Database
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  openSettings: () => void;
  stats?: { projects: number; knowledge: number };
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentTab, 
  setCurrentTab, 
  openSettings,
  stats 
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'Projects', icon: FolderKanban, badge: stats?.projects },
    { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen, badge: stats?.knowledge },
    { id: 'assistant', label: 'Cognis Assistant', icon: Bot, isNew: true },
    { id: 'feedback', label: 'Feedback & Quality', icon: MessageSquareHeart },
  ];

  return (
    <aside className="w-64 bg-[#0B0F19] border-r border-[#1F293D] flex flex-col h-screen select-none shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#1F293D]/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <BrainCircuit className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg text-white tracking-tight">COGNIS</span>
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                MVP
              </span>
            </div>
            <p className="text-[11px] text-gray-400 font-medium">Engineering Memory</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          Core Platform
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-[#131B2E]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-gray-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.isNew && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/30">
                  <Sparkles className="w-2.5 h-2.5" /> AI
                </span>
              )}
              {item.badge !== undefined && item.badge > 0 && !item.isNew && (
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-[#1F293D] text-gray-300 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom section & Settings */}
      <div className="p-3 border-t border-[#1F293D]/60 space-y-2">
        <div className="px-3 py-2 rounded-lg bg-[#111827]/80 border border-[#1F293D] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs text-gray-300">Memory Store</span>
          </div>
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        </div>

        <button
          onClick={openSettings}
          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-lg text-sm text-gray-400 hover:text-gray-200 hover:bg-[#131B2E] transition-all"
        >
          <Settings className="w-4 h-4 text-gray-400" />
          <span>Settings & Keys</span>
        </button>
      </div>
    </aside>
  );
};
