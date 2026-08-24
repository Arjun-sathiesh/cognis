export type KnowledgeCategory = 'architecture' | 'standards' | 'defects' | 'lessons' | 'technologies';

export interface Project {
  id: number;
  name: string;
  description: string | null;
  status: 'Pending' | 'Analyzing' | 'Analyzed' | 'Error';
  document_count: number;
  knowledge_count: number;
  created_at: string;
}

export interface DocumentItem {
  id: number;
  project_id: number;
  filename: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

export interface KnowledgeItem {
  id: number;
  project_id: number;
  document_id: number | null;
  category: KnowledgeCategory;
  title: string;
  content: string;
  rationale_or_solution: string | null;
  source: string;
  metadata_json?: string;
  created_at: string;
}

export interface SourceCitation {
  id: number;
  title: string;
  category: string;
  source: string;
  excerpt: string;
}

export interface ChatMessageItem {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  mode: string;
  sources: SourceCitation[];
  created_at: string;
  userFeedback?: 'helpful' | 'not_helpful' | null;
}

export interface FeedbackStat {
  total: number;
  helpful: number;
  not_helpful: number;
  helpfulness_rate: number;
}

export interface DashboardStats {
  totals: {
    projects: number;
    documents: number;
    knowledge_items: number;
    architecture: number;
    standards: number;
    defects: number;
    lessons: number;
    technologies: number;
  };
  feedback: FeedbackStat;
  distribution: {
    category: string;
    count: number;
    key: string;
    color: string;
  }[];
  recent_knowledge: {
    id: number;
    title: string;
    category: string;
    source: string;
    content_snippet: string;
    created_at: string;
  }[];
  projects: {
    id: number;
    name: string;
    description: string;
    status: string;
    doc_count: number;
    knowledge_count: number;
  }[];
}

export type AssistantMode = 'Requirements' | 'Architecture' | 'Debugging' | 'Code Review' | 'Planning';
