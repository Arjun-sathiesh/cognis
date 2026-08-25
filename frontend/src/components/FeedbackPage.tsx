import React, { useState, useEffect } from 'react';
import { 
  ThumbsUp, 
  ThumbsDown, 
  MessageSquare, 
  TrendingUp
} from 'lucide-react';
import { api } from '../api/client';

export const FeedbackPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [s, list] = await Promise.all([
        api.getFeedbackStats(),
        api.getFeedbackList()
      ]);
      setStats(s);
      setFeedbackList(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Feedback & Engineering Quality</h2>
        <p className="text-xs text-gray-400">Telemetry on answer relevance, developer ratings, and feedback reviews</p>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="p-5 rounded-2xl bg-[#111827] border border-[#1F293D] space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Helpfulness Rate</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">{stats?.helpfulness_rate ?? 0}%</div>
          <p className="text-[11px] text-gray-500">Positive engineer feedback</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#111827] border border-[#1F293D] space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Total Reviews</span>
            <MessageSquare className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">{stats?.total || 0}</div>
          <p className="text-[11px] text-gray-500">Collected responses</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#111827] border border-[#1F293D] space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Helpful Votes</span>
            <ThumbsUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">{stats?.helpful || 0}</div>
          <p className="text-[11px] text-gray-500">Marked relevant</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#111827] border border-[#1F293D] space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Improvement Requests</span>
            <ThumbsDown className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-white">{stats?.not_helpful || 0}</div>
          <p className="text-[11px] text-gray-500">Needs refinement</p>
        </div>
      </div>

      {/* Feedback Logs Table */}
      <div className="p-6 rounded-2xl bg-[#111827] border border-[#1F293D] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white tracking-tight">Recent Feedback Activity</h3>
          <span className="text-xs text-gray-400">Live database audit</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-gray-400">Loading feedback records...</div>
        ) : feedbackList.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400 border border-dashed border-[#1F293D] rounded-xl">
            No feedback recorded yet. Rate answers in the Cognis Assistant to populate this log.
          </div>
        ) : (
          <div className="divide-y divide-[#1F293D]/60">
            {feedbackList.map((fb) => (
              <div key={fb.id} className="py-3.5 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1 ${
                      fb.rating === 'helpful'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    }`}>
                      {fb.rating === 'helpful' ? <ThumbsUp className="w-2.5 h-2.5" /> : <ThumbsDown className="w-2.5 h-2.5" />}
                      {fb.rating === 'helpful' ? 'Helpful' : 'Not Helpful'}
                    </span>
                    <span className="text-xs text-gray-400 italic truncate max-w-lg">
                      "{fb.message_snippet}"
                    </span>
                  </div>
                  {fb.comment && (
                    <div className="text-xs text-gray-200 bg-[#0B0F19] p-2 rounded-lg border border-[#1F293D]">
                      <strong className="text-indigo-400">Engineer Comment:</strong> {fb.comment}
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-gray-500 whitespace-nowrap">
                  {new Date(fb.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
