import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import {
  Bot,
  Send,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Layers,
  FileText,
  ExternalLink,
  RotateCcw,
  CheckCircle2,
  Code2,
  Bug,
  Lightbulb,
  BookOpen,
} from "lucide-react";
import type {
  AssistantMode,
  ChatMessageItem,
  Project,
  SourceCitation,
} from "../types";
import { api } from "../api/client";

interface AssistantPageProps {
  onViewSource?: (source: SourceCitation) => void;
}

export const AssistantPage: React.FC<AssistantPageProps> = ({
  onViewSource,
}) => {
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputQuery, setInputQuery] = useState("");
  const [activeMode, setActiveMode] = useState<AssistantMode>("Architecture");
  const [loading, setLoading] = useState(false);
  const [activeFeedbackMsgId, setActiveFeedbackMsgId] = useState<number | null>(
    null,
  );
  const [feedbackComment, setFeedbackComment] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccessMsg, setFeedbackSuccessMsg] = useState<{
    [msgId: number]: string;
  }>({});
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<number | undefined>();

  const chatEndRef = useRef<HTMLDivElement>(null);

  const modes: { id: AssistantMode; label: string; desc: string; icon: any }[] =
    [
      {
        id: "Architecture",
        label: "Architecture",
        desc: "ADRs, systems, databases & scaling",
        icon: Layers,
      },
      {
        id: "Requirements",
        label: "Requirements",
        desc: "Specifications & domain scope",
        icon: BookOpen,
      },
      {
        id: "Debugging",
        label: "Debugging",
        desc: "Root cause analysis & bug fixes",
        icon: Bug,
      },
      {
        id: "Code Review",
        label: "Code Review",
        desc: "Standards, typing & transactions",
        icon: Code2,
      },
      {
        id: "Planning",
        label: "Planning",
        desc: "Roadmaps & risk mitigation",
        icon: Lightbulb,
      },
    ];

  const suggestedQuestions = [
    {
      q: "What authentication approach should we use based on previous project knowledge?",
      mode: "Architecture" as AssistantMode,
    },
    {
      q: "Why was PostgreSQL selected as the primary database instead of MongoDB?",
      mode: "Architecture" as AssistantMode,
    },
    {
      q: "What defect pattern caused double-spend balance inconsistencies during high concurrency?",
      mode: "Debugging" as AssistantMode,
    },
    {
      q: "What standard must all API error responses follow according to our guidelines?",
      mode: "Code Review" as AssistantMode,
    },
    {
      q: "What lesson was learned regarding payment webhook idempotency?",
      mode: "Planning" as AssistantMode,
    },
  ];

  const loadHistory = async (projectId?: number) => {
    try {
      const history = await api.getChatHistory(projectId);
      setMessages(history);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const loadProjectsAndHistory = async () => {
      try {
        const loadedProjects = await api.getProjects();
        setProjects(loadedProjects);
        const projectId = loadedProjects[0]?.id;
        setActiveProjectId(projectId);
      } catch (err) {
        console.error(err);
        await loadHistory();
      }
    };

    loadProjectsAndHistory();
  }, []);

  useEffect(() => {
    if (projects.length > 0) {
      loadHistory(activeProjectId);
    }
  }, [activeProjectId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (
    questionText?: string,
    targetMode?: AssistantMode,
  ) => {
    const q = (questionText || inputQuery).trim();
    const modeToUse = targetMode || activeMode;
    if (!q || loading) return;

    setInputQuery("");

    // Optimistic user message
    const tempUserMsg: ChatMessageItem = {
      id: Date.now(),
      role: "user",
      content: q,
      mode: modeToUse,
      sources: [],
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setLoading(true);

    try {
      const resp = await api.askAssistant(q, modeToUse, activeProjectId);
      setMessages((prev) => [...prev, resp]);
    } catch (err) {
      console.error(err);
      const errorMsg: ChatMessageItem = {
        id: Date.now() + 1,
        role: "assistant",
        content:
          "An error occurred while connecting to the Cognis memory engine. Please check your API keys or database connection.",
        mode: modeToUse,
        sources: [],
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (
    messageId: number,
    rating: "helpful" | "not_helpful",
  ) => {
    if (rating === "not_helpful") {
      setActiveFeedbackMsgId(messageId);
      return;
    }

    try {
      await api.submitFeedback(messageId, "helpful");
      setFeedbackSuccessMsg((prev) => ({
        ...prev,
        [messageId]: "Feedback recorded: Marked as Helpful 👍",
      }));
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, userFeedback: "helpful" } : m,
        ),
      );
    } catch (err) {
      console.error(err);
    }
  };

  const submitNotHelpfulComment = async (messageId: number) => {
    try {
      setSubmittingFeedback(true);
      await api.submitFeedback(messageId, "not_helpful", feedbackComment);
      setFeedbackSuccessMsg((prev) => ({
        ...prev,
        [messageId]: "Feedback recorded: Marked as Not Helpful 👎",
      }));
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, userFeedback: "not_helpful" } : m,
        ),
      );
      setActiveFeedbackMsgId(null);
      setFeedbackComment("");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleClearChat = async () => {
    if (!confirm("Clear assistant conversation history?")) return;
    try {
      await api.clearChatHistory(activeProjectId);
      setMessages([]);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-6xl mx-auto p-4 md:p-6 space-y-4">
      {/* Top Title & Subtitle */}
      <div className="flex items-center justify-between border-b border-[#1F293D]/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Cognis Engineering Assistant
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-semibold border border-indigo-500/30">
              RAG Active
            </span>
          </div>
          <p className="text-xs text-gray-400">
            Organizational memory for software engineering
          </p>
        </div>

        {messages.length > 0 && (
          <button
            onClick={handleClearChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-gray-200 hover:bg-[#111827] border border-[#1F293D] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Chat</span>
          </button>
        )}
      </div>

      {/* Mode Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {modes.map((m) => {
          const Icon = m.icon;
          const isActive = activeMode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setActiveMode(m.id)}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                isActive
                  ? "bg-indigo-600/20 border-indigo-500/50 shadow-md shadow-indigo-500/10"
                  : "bg-[#111827] border-[#1F293D] hover:border-gray-600"
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon
                  className={`w-3.5 h-3.5 ${isActive ? "text-indigo-400" : "text-gray-400"}`}
                />
                <span
                  className={`text-xs font-semibold ${isActive ? "text-indigo-300" : "text-gray-300"}`}
                >
                  {m.label}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 truncate mt-0.5">
                {m.desc}
              </p>
            </button>
          );
        })}
      </div>

      {projects.length > 0 && (
        <div className="flex items-center gap-3">
          <label
            htmlFor="assistant-project"
            className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider"
          >
            Project context
          </label>
          <select
            id="assistant-project"
            value={activeProjectId ?? ""}
            onChange={(e) => setActiveProjectId(Number(e.target.value))}
            className="bg-[#111827] border border-[#1F293D] rounded-lg px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-2 py-2">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-6 text-center max-w-2xl mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-500/25">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white tracking-tight">
                Ask Cognis About Your Software Codebases
              </h3>
              <p className="text-xs text-gray-400 max-w-md">
                Cognis provides answers strictly grounded in your organization's
                architectural decisions, coding rules, defect postmortems, and
                engineering retrospectives.
              </p>
            </div>

            {/* Suggested Prompts */}
            <div className="w-full space-y-2">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                Suggested Engineering Questions
              </span>
              <div className="grid grid-cols-1 gap-2 text-left">
                {suggestedQuestions.map((sq, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setActiveMode(sq.mode);
                      handleSend(sq.q, sq.mode);
                    }}
                    className="p-3 rounded-xl bg-[#111827] hover:bg-[#131B2E] border border-[#1F293D] hover:border-indigo-500/40 text-xs text-gray-300 hover:text-white transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
                      <span>{sq.q}</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
                      {sq.mode}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"} space-y-2`}
            >
              {/* Message Header */}
              <div className="flex items-center gap-2 px-1 text-[11px] text-gray-400">
                {msg.role === "user" ? (
                  <>
                    <span>You</span>
                    <span>•</span>
                    <span className="text-indigo-400 font-medium">
                      Mode: {msg.mode}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-4 h-4 rounded bg-indigo-600 flex items-center justify-center text-[10px] text-white font-bold">
                      C
                    </div>
                    <span className="font-semibold text-gray-300">
                      Cognis Engine
                    </span>
                    <span>•</span>
                    <span className="text-indigo-400">{msg.mode} Mode</span>
                  </>
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-3xl rounded-2xl p-5 ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white rounded-br-sm shadow-md"
                    : "bg-[#111827] border border-[#1F293D] text-gray-200 rounded-bl-sm space-y-4 shadow-xl"
                }`}
              >
                {msg.role === "user" ? (
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                ) : (
                  <div className="prose-dark text-xs space-y-2">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                )}

                {/* Sources & Citations Section */}
                {msg.role === "assistant" &&
                  msg.sources &&
                  msg.sources.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-[#1F293D] space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-300">
                        <FileText className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Sources & Grounded Citations</span>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1">
                        {msg.sources.map((src, idx) => (
                          <button
                            key={idx}
                            onClick={() => onViewSource && onViewSource(src)}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#0B0F19] hover:bg-[#131B2E] border border-[#1F293D] hover:border-indigo-500/50 text-[11px] text-indigo-300 transition-colors group text-left"
                            title={src.excerpt}
                          >
                            <span className="text-[10px] uppercase font-bold text-gray-400">
                              [{src.source}]
                            </span>
                            <span className="font-medium group-hover:text-white">
                              {src.title}
                            </span>
                            <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-indigo-400" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Feedback Widget Under Every Assistant Answer */}
                {msg.role === "assistant" && (
                  <div className="mt-3 pt-3 border-t border-[#1F293D]/60 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[11px] text-gray-400">
                        Was this response helpful?
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleFeedback(msg.id, "helpful")}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all text-xs font-medium ${
                            msg.userFeedback === "helpful"
                              ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                              : "bg-[#0B0F19] border-[#1F293D] hover:border-emerald-500/40 text-gray-400 hover:text-emerald-400"
                          }`}
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span>Helpful</span>
                        </button>

                        <button
                          onClick={() => handleFeedback(msg.id, "not_helpful")}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all text-xs font-medium ${
                            msg.userFeedback === "not_helpful"
                              ? "bg-rose-500/20 border-rose-500/40 text-rose-300"
                              : "bg-[#0B0F19] border-[#1F293D] hover:border-rose-500/40 text-gray-400 hover:text-rose-400"
                          }`}
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                          <span>Not Helpful</span>
                        </button>
                      </div>
                    </div>

                    {/* Success Notice */}
                    {feedbackSuccessMsg[msg.id] && (
                      <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{feedbackSuccessMsg[msg.id]}</span>
                      </div>
                    )}

                    {/* Not Helpful Improvement Form */}
                    {activeFeedbackMsgId === msg.id && (
                      <div className="p-3 rounded-xl bg-[#0B0F19] border border-[#1F293D] space-y-2 mt-1 animate-in fade-in">
                        <label className="block text-[11px] font-semibold text-gray-300">
                          How could this answer be improved?
                        </label>
                        <textarea
                          rows={2}
                          placeholder="e.g. Needs more details on database connection pool configuration..."
                          value={feedbackComment}
                          onChange={(e) => setFeedbackComment(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg bg-[#111827] border border-[#1F293D] text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-indigo-500 resize-none"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setActiveFeedbackMsgId(null)}
                            className="px-2.5 py-1 text-[11px] text-gray-400 hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => submitNotHelpfulComment(msg.id)}
                            disabled={submittingFeedback}
                            className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold transition-all disabled:opacity-50"
                          >
                            {submittingFeedback
                              ? "Submitting..."
                              : "Submit Feedback"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Loading Thinking Indicator */}
        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-xs text-white font-bold">
              C
            </div>
            <div className="p-4 rounded-2xl bg-[#111827] border border-[#1F293D] space-y-2">
              <div className="flex items-center gap-2 text-xs text-indigo-400 font-medium">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></div>
                <span>
                  Searching organizational knowledge & synthesizing grounded
                  answer...
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="w-48 h-2 bg-gray-700 rounded animate-pulse"></div>
                <div className="w-64 h-2 bg-gray-700 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Query Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="relative bg-[#111827] border border-[#1F293D] rounded-2xl p-2 flex items-center gap-2 shadow-2xl focus-within:border-indigo-500/80 transition-colors"
      >
        <input
          type="text"
          placeholder={`Ask Cognis in ${activeMode} mode (e.g. "What authentication approach should we use?")...`}
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          disabled={loading}
          className="flex-1 bg-transparent px-4 py-2 text-xs text-white placeholder:text-gray-500 focus:outline-none"
        />

        <button
          type="submit"
          disabled={loading || !inputQuery.trim()}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-40 shrink-0"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
