import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardPage } from './components/DashboardPage';
import { ProjectsPage } from './components/ProjectsPage';
import { KnowledgeBasePage } from './components/KnowledgeBasePage';
import { AssistantPage } from './components/AssistantPage';
import { FeedbackPage } from './components/FeedbackPage';
import { SettingsModal } from './components/SettingsModal';
import { KnowledgeDetailModal } from './components/KnowledgeDetailModal';
import { DocumentViewerModal } from './components/DocumentViewerModal';
import type { DashboardStats, KnowledgeItem, SourceCitation } from './types';
import { api } from './api/client';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState<boolean>(true);
  
  // Modals
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [inspectKnowledgeItem, setInspectKnowledgeItem] = useState<KnowledgeItem | null>(null);
  const [viewDocumentId, setViewDocumentId] = useState<number | null>(null);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSeedSample = async () => {
    try {
      setIsSeeding(true);
      await api.seedSampleData();
      await fetchStats();
      setCurrentTab('dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleViewKnowledgeById = async (id: number) => {
    try {
      const item = await api.getKnowledgeItem(id);
      setInspectKnowledgeItem(item);
    } catch (err) {
      console.error(err);
    }
  };

  const handleViewSource = async (source: SourceCitation) => {
    if (source.id) {
      handleViewKnowledgeById(source.id);
    }
  };

  const handleAskAboutItem = (_item: KnowledgeItem) => {
    setCurrentTab('assistant');
  };

  const getPageTitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return 'Executive Overview';
      case 'projects':
        return 'Software Projects & Ingestion';
      case 'knowledge':
        return 'Organizational Knowledge Base';
      case 'assistant':
        return 'Cognis Engineering Assistant';
      case 'feedback':
        return 'Feedback & Quality Metrics';
      default:
        return 'Cognis Engineering Memory';
    }
  };

  const getPageSubtitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return 'Organizational memory metrics & recent engineering intelligence';
      case 'projects':
        return 'Ingest codebase specifications, ADRs, and postmortems';
      case 'knowledge':
        return 'Browse and search extracted architecture decisions & rules';
      case 'assistant':
        return 'Grounded conversational software engineering assistant';
      case 'feedback':
        return 'Engineer ratings and answer refinement tracking';
      default:
        return undefined;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#090D16] text-[#F3F4F6]">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        openSettings={() => setShowSettings(true)}
        stats={{
          projects: stats?.totals.projects || 0,
          knowledge: stats?.totals.knowledge_items || 0
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Global Header */}
        <Header
          title={getPageTitle()}
          subtitle={getPageSubtitle()}
          onSeedSample={handleSeedSample}
          isSeeding={isSeeding}
        />

        {/* Dynamic Page Views */}
        <main className="flex-1 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <DashboardPage
              stats={stats}
              loading={statsLoading}
              onNavigate={(tab) => setCurrentTab(tab)}
              onViewKnowledge={handleViewKnowledgeById}
              onSeedSample={handleSeedSample}
            />
          )}

          {currentTab === 'projects' && (
            <ProjectsPage
              onProjectAnalyzed={fetchStats}
              onViewDocument={(id) => setViewDocumentId(id)}
            />
          )}

          {currentTab === 'knowledge' && (
            <KnowledgeBasePage
              onInspectItem={(item) => setInspectKnowledgeItem(item)}
              onAskAboutItem={handleAskAboutItem}
              onSeedSample={handleSeedSample}
            />
          )}

          {currentTab === 'assistant' && (
            <AssistantPage
              onViewSource={handleViewSource}
            />
          )}

          {currentTab === 'feedback' && (
            <FeedbackPage />
          )}
        </main>
      </div>

      {/* Modals */}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}

      {inspectKnowledgeItem && (
        <KnowledgeDetailModal
          item={inspectKnowledgeItem}
          onClose={() => setInspectKnowledgeItem(null)}
          onAskAboutItem={handleAskAboutItem}
        />
      )}

      {viewDocumentId !== null && (
        <DocumentViewerModal
          documentId={viewDocumentId}
          onClose={() => setViewDocumentId(null)}
        />
      )}
    </div>
  );
};

export default App;
