import React, { useState, useEffect } from 'react';
import { 
  FolderPlus, 
  FolderKanban,
  Upload, 
  Trash2, 
  FileText, 
  BrainCircuit, 
  CheckCircle2, 
  Clock, 
  X, 
  Sparkles, 
  Files
} from 'lucide-react';
import type { Project, DocumentItem } from '../types';
import { api } from '../api/client';

interface ProjectsPageProps {
  onProjectAnalyzed?: () => void;
  onViewDocument?: (docId: number) => void;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({ 
  onProjectAnalyzed,
  onViewDocument
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  
  // Modals & UI States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [creating, setCreating] = useState(false);

  const [analyzingId, setAnalyzingId] = useState<number | null>(null);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);
  const [analysisResultMsg, setAnalysisResultMsg] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const list = await api.getProjects();
      setProjects(list);
      if (list.length > 0 && !selectedProject) {
        setSelectedProject(list[0]);
      } else if (selectedProject) {
        const updated = list.find(p => p.id === selectedProject.id);
        if (updated) setSelectedProject(updated);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async (projectId: number) => {
    try {
      const docs = await api.getDocuments(projectId);
      setDocuments(docs);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadDocuments(selectedProject.id);
    }
  }, [selectedProject?.id]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    try {
      setCreating(true);
      const created = await api.createProject(newProjectName.trim(), newProjectDesc.trim() || undefined);
      setNewProjectName('');
      setNewProjectDesc('');
      setShowCreateModal(false);
      await loadProjects();
      setSelectedProject(created);
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProject = async (id: number) => {
    if (!confirm('Are you sure you want to delete this project and all its extracted knowledge?')) return;
    try {
      await api.deleteProject(id);
      if (selectedProject?.id === id) {
        setSelectedProject(null);
      }
      await loadProjects();
      if (onProjectAnalyzed) onProjectAnalyzed();
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedProject || !e.target.files || e.target.files.length === 0) return;
    try {
      setUploading(true);
      setUploadSuccessMsg(null);
      setAnalysisResultMsg(null);

      const files = Array.from(e.target.files);
      for (const file of files) {
        await api.uploadDocument(selectedProject.id, file);
      }

      setUploadSuccessMsg(`Document${files.length > 1 ? 's' : ''} uploaded successfully.`);
      await loadDocuments(selectedProject.id);
      await loadProjects();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyze = async (projectId: number) => {
    try {
      setAnalyzingId(projectId);
      setAnalysisResultMsg(null);
      const res = await api.analyzeProject(projectId);
      setAnalysisResultMsg(`Knowledge extraction completed. Extracted ${res.extracted_count} structured items.`);
      await loadProjects();
      if (onProjectAnalyzed) onProjectAnalyzed();
    } catch (err) {
      console.error(err);
      setAnalysisResultMsg('Knowledge extraction encountered an issue. Please try again.');
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleDeleteDocument = async (docId: number) => {
    if (!selectedProject) return;
    try {
      await api.deleteDocument(docId);
      await loadDocuments(selectedProject.id);
      await loadProjects();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Header & Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Software Projects & Ingestion</h2>
          <p className="text-xs text-gray-400">Manage codebases, upload architecture docs, and extract engineering memory</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all active:scale-95"
        >
          <FolderPlus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Main Grid: Projects List (Left) & Document Workspace (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Project Cards List */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">
            Projects ({projects.length})
          </h3>

          {loading ? (
            <div className="p-8 text-center text-xs text-gray-400">Loading projects...</div>
          ) : projects.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#111827] border border-[#1F293D] text-center space-y-3">
              <FolderKanban className="w-8 h-8 text-gray-400 mx-auto" />
              <p className="text-xs text-gray-300">No projects yet. Create your first project to get started.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium"
              >
                Create Project
              </button>
            </div>
          ) : (
            projects.map((proj) => {
              const isSelected = selectedProject?.id === proj.id;
              const isAnalyzing = analyzingId === proj.id;

              return (
                <div
                  key={proj.id}
                  onClick={() => setSelectedProject(proj)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#131B2E] border-indigo-500/60 shadow-lg shadow-indigo-500/10'
                      : 'bg-[#111827] border-[#1F293D] hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-base font-semibold text-white tracking-tight">{proj.name}</h4>
                      {proj.description && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{proj.description}</p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProject(proj.id);
                      }}
                      className="text-gray-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
                      title="Delete Project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Stats Badges */}
                  <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-[#1F293D]/60 text-xs">
                    <div className="flex items-center gap-2 text-gray-300">
                      <Files className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Documents: <strong className="text-white">{proj.document_count}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <BrainCircuit className="w-3.5 h-3.5 text-purple-400" />
                      <span>Knowledge: <strong className="text-white">{proj.knowledge_count}</strong></span>
                    </div>
                  </div>

                  {/* Status & Analysis Action */}
                  <div className="flex items-center justify-between mt-4 pt-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1.5 ${
                      proj.status === 'Analyzed'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : proj.status === 'Analyzing'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                    }`}>
                      {proj.status === 'Analyzed' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      <span>Status: {proj.status}</span>
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAnalyze(proj.id);
                      }}
                      disabled={isAnalyzing || proj.document_count === 0}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 text-white transition-all shadow-sm active:scale-95 disabled:opacity-50"
                    >
                      {isAnalyzing ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Extracting...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3" />
                          <span>Analyze Project</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Project Details & Upload Area */}
        <div className="lg:col-span-7">
          {selectedProject ? (
            <div className="space-y-6">
              {/* Project Header Card */}
              <div className="p-6 rounded-2xl bg-[#111827] border border-[#1F293D] space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Active Workspace</span>
                    <h3 className="text-xl font-bold text-white tracking-tight">{selectedProject.name}</h3>
                    <p className="text-xs text-gray-300 mt-1">{selectedProject.description || 'No description provided.'}</p>
                  </div>

                  <button
                    onClick={() => handleAnalyze(selectedProject.id)}
                    disabled={analyzingId === selectedProject.id || documents.length === 0}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {analyzingId === selectedProject.id ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Analyzing Knowledge...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Analyze Project</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Notifications & Banners */}
                {uploadSuccessMsg && (
                  <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>{uploadSuccessMsg}</span>
                    </div>
                    <button
                      onClick={() => handleAnalyze(selectedProject.id)}
                      className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px]"
                    >
                      Analyze Project Now
                    </button>
                  </div>
                )}

                {analysisResultMsg && (
                  <div className="p-3 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span>{analysisResultMsg}</span>
                  </div>
                )}

                {/* Upload Drag & Drop Zone */}
                <div className="border-2 border-dashed border-[#1F293D] hover:border-indigo-500/50 rounded-xl p-6 text-center space-y-2 bg-[#0B0F19]/50 transition-colors relative">
                  <input
                    type="file"
                    multiple
                    accept=".md,.txt,.pdf,.docx,.doc,.json"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    disabled={uploading}
                  />
                  <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-white">Click or drag documents to upload</span>
                    <p className="text-[11px] text-gray-400">Supported formats: PDF, Markdown (.md), Plain Text (.txt), DOCX</p>
                  </div>
                  {uploading && (
                    <p className="text-xs text-indigo-400 font-medium animate-pulse">Uploading and indexing text...</p>
                  )}
                </div>
              </div>

              {/* Uploaded Documents List */}
              <div className="p-6 rounded-2xl bg-[#111827] border border-[#1F293D] space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
                    Uploaded Documents ({documents.length})
                  </h4>
                  <span className="text-[11px] text-gray-400">Real parsed document repository</span>
                </div>

                {documents.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-400 border border-dashed border-[#1F293D] rounded-xl">
                    No documents uploaded yet. Upload architecture or bug report files above.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3 rounded-xl bg-[#0B0F19]/70 hover:bg-[#131B2E] border border-[#1F293D] flex items-center justify-between gap-3 transition-colors group"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="overflow-hidden">
                            <h5 className="text-xs font-semibold text-gray-200 truncate">{doc.filename}</h5>
                            <p className="text-[10px] text-gray-400 font-mono">
                              {(doc.file_size / 1024).toFixed(1)} KB • {doc.file_type}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {onViewDocument && (
                            <button
                              onClick={() => onViewDocument(doc.id)}
                              className="px-2.5 py-1 rounded bg-[#1F293D] hover:bg-[#374151] text-xs text-gray-300 font-medium transition-colors"
                            >
                              View Content
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-2xl bg-[#111827] border border-[#1F293D] text-center space-y-2">
              <FolderKanban className="w-8 h-8 text-gray-400 mx-auto" />
              <p className="text-sm text-gray-300">Select a project on the left to view and upload documents.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#111827] border border-[#1F293D] rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white tracking-tight">Create Software Project</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Project Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FinTrack"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#0B0F19] border border-[#1F293D] text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Description</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Personal finance management application and ledger service..."
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#0B0F19] border border-[#1F293D] text-white text-xs focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newProjectName.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold disabled:opacity-50 transition-all"
                >
                  {creating ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
