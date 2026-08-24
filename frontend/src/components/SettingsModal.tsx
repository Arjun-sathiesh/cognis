import React, { useState, useEffect } from "react";
import { X, Key, Database, CheckCircle2 } from "lucide-react";
import { api } from "../api/client";

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const [anthropicKey, setAnthropicKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [groqKey, setGroqKey] = useState("");
  const [openrouterKey, setOpenrouterKey] = useState("");
  const [provider, setProvider] = useState("anthropic");
  const [availableProviders, setAvailableProviders] = useState<any>({});
  const [dbType, setDbType] = useState("SQLite + Embeddings");
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    api
      .getSettings()
      .then((data) => {
        setAvailableProviders(data.providers_available || {});
        setProvider(data.active_provider || "anthropic");
        setDbType(data.database_type || "SQLite + Embeddings");
      })
      .catch(console.error);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.updateSettings({
        anthropic_api_key: anthropicKey || undefined,
        openai_api_key: openaiKey || undefined,
        gemini_api_key: geminiKey || undefined,
        groq_api_key: groqKey || undefined,
        openrouter_api_key: openrouterKey || undefined,
        default_provider: provider,
      });
      setStatusMsg("Settings and credentials saved successfully!");
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.error(err);
      setStatusMsg("Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#111827] border border-[#1F293D] rounded-2xl p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                System Settings & LLM Keys
              </h3>
              <p className="text-[11px] text-gray-400">
                Configure AI inference provider & storage engine
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Database & Storage Badge */}
        <div className="p-3 rounded-xl bg-[#0B0F19] border border-[#1F293D] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="text-xs font-semibold text-white">
                Database Engine
              </span>
              <p className="text-[10px] text-gray-400">{dbType}</p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            Connected
          </span>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Active LLM Provider
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#0B0F19] border border-[#1F293D] text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="anthropic">Anthropic Claude (Recommended)</option>
              <option value="openai">OpenAI (GPT-4o / GPT-4o-mini)</option>
              <option value="gemini">Google Gemini (Gemini 2.0 Flash)</option>
              <option value="groq">Groq (Llama 3.3 70B)</option>
              <option value="openrouter">
                OpenRouter (OpenAI GPT-4o-mini)
              </option>
            </select>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-gray-300">
                  Anthropic API Key
                </label>
                {availableProviders.anthropic && (
                  <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Configured in Env
                  </span>
                )}
              </div>
              <input
                type="password"
                placeholder={
                  availableProviders.anthropic
                    ? "••••••••••••••••••••••••"
                    : "sk-ant-..."
                }
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-[#0B0F19] border border-[#1F293D] text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-gray-300">
                      OpenRouter API Key
                    </label>
                    {availableProviders.openrouter && (
                      <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Configured in Env
                      </span>
                    )}
                  </div>
                  <input
                    type="password"
                    placeholder="sk-or-v1-..."
                    value={openrouterKey}
                    onChange={(e) => setOpenrouterKey(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#0B0F19] border border-[#1F293D] text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <label className="text-xs font-medium text-gray-300">
                  OpenAI API Key
                </label>
                {availableProviders.openai && (
                  <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Configured in Env
                  </span>
                )}
              </div>
              <input
                type="password"
                placeholder="sk-..."
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-[#0B0F19] border border-[#1F293D] text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-gray-300">
                  Google Gemini API Key
                </label>
                {availableProviders.gemini && (
                  <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Configured in Env
                  </span>
                )}
              </div>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-[#0B0F19] border border-[#1F293D] text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-gray-300">
                  Groq API Key
                </label>
                {availableProviders.groq && (
                  <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Configured in Env
                  </span>
                )}
              </div>
              <input
                type="password"
                placeholder="gsk_..."
                value={groqKey}
                onChange={(e) => setGroqKey(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-[#0B0F19] border border-[#1F293D] text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {statusMsg && (
            <div className="p-2.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-indigo-400" />
              <span>{statusMsg}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-400 hover:text-white"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
