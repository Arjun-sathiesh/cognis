import type { 
  Project, 
  DocumentItem, 
  KnowledgeItem, 
  DashboardStats, 
  ChatMessageItem, 
  AssistantMode,
  FeedbackStat 
} from '../types';

const API_BASE = 'http://127.0.0.1:8000/api';

export const api = {
  // Stats
  async getDashboardStats(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE}/stats/dashboard`);
    if (!res.ok) throw new Error('Failed to fetch dashboard stats');
    return res.json();
  },

  // Projects
  async getProjects(): Promise<Project[]> {
    const res = await fetch(`${API_BASE}/projects`);
    if (!res.ok) throw new Error('Failed to fetch projects');
    return res.json();
  },

  async createProject(name: string, description?: string): Promise<Project> {
    const res = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    });
    if (!res.ok) throw new Error('Failed to create project');
    return res.json();
  },

  async deleteProject(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/projects/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete project');
  },

  async analyzeProject(id: number): Promise<{ message: string; status: string; extracted_count: number }> {
    const res = await fetch(`${API_BASE}/projects/${id}/analyze`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to analyze project');
    return res.json();
  },

  // Documents
  async getDocuments(projectId: number): Promise<DocumentItem[]> {
    const res = await fetch(`${API_BASE}/documents/project/${projectId}`);
    if (!res.ok) throw new Error('Failed to fetch project documents');
    return res.json();
  },

  async uploadDocument(projectId: number, file: File): Promise<{ message: string; id: number; filename: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/documents/project/${projectId}/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to upload document');
    return res.json();
  },

  async getDocumentContent(docId: number): Promise<{ id: number; filename: string; file_type: string; content: string }> {
    const res = await fetch(`${API_BASE}/documents/${docId}/content`);
    if (!res.ok) throw new Error('Failed to fetch document content');
    return res.json();
  },

  async deleteDocument(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/documents/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete document');
  },

  // Knowledge Base
  async getKnowledge(projectId?: number, category?: string, search?: string): Promise<KnowledgeItem[]> {
    const params = new URLSearchParams();
    if (projectId) params.append('project_id', projectId.toString());
    if (category && category !== 'all') params.append('category', category);
    if (search && search.trim()) params.append('search', search.trim());

    const res = await fetch(`${API_BASE}/knowledge?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch knowledge items');
    return res.json();
  },

  async getKnowledgeItem(id: number): Promise<KnowledgeItem> {
    const res = await fetch(`${API_BASE}/knowledge/${id}`);
    if (!res.ok) throw new Error('Failed to fetch knowledge item');
    return res.json();
  },

  // AI Assistant
  async askAssistant(question: string, mode: AssistantMode = 'Architecture', projectId?: number): Promise<ChatMessageItem> {
    const res = await fetch(`${API_BASE}/assistant/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, mode, project_id: projectId || null }),
    });
    if (!res.ok) throw new Error('Assistant query failed');
    return res.json();
  },

  async getChatHistory(projectId?: number): Promise<ChatMessageItem[]> {
    const params = new URLSearchParams();
    if (projectId) params.append('project_id', projectId.toString());
    const res = await fetch(`${API_BASE}/assistant/history?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to load chat history');
    return res.json();
  },

  async clearChatHistory(projectId?: number): Promise<void> {
    const params = new URLSearchParams();
    if (projectId) params.append('project_id', projectId.toString());
    await fetch(`${API_BASE}/assistant/history?${params.toString()}`, { method: 'DELETE' });
  },

  // Feedback
  async submitFeedback(messageId: number, rating: 'helpful' | 'not_helpful', comment?: string): Promise<void> {
    const res = await fetch(`${API_BASE}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message_id: messageId, rating, comment }),
    });
    if (!res.ok) throw new Error('Failed to submit feedback');
  },

  async getFeedbackStats(): Promise<FeedbackStat> {
    const res = await fetch(`${API_BASE}/feedback/stats`);
    if (!res.ok) throw new Error('Failed to fetch feedback stats');
    return res.json();
  },

  async getFeedbackList(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/feedback/list`);
    if (!res.ok) throw new Error('Failed to fetch feedback list');
    return res.json();
  },

  // Sample Data Seeding
  async seedSampleData(): Promise<{ message: string; project_id: number; project_name: string }> {
    const res = await fetch(`${API_BASE}/sample-data/seed`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to seed sample project');
    return res.json();
  },

  // Settings
  async getSettings(): Promise<any> {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  async updateSettings(data: any): Promise<void> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update settings');
  }
};
