import React from "react";
import { User, Calendar, BookOpen, Tag, HelpCircle, X, Sparkles } from "lucide-react";
import { GoalItem, ClusterItem } from "../types";
import { getClusterColor } from "./GalaxyScene";

interface GoalDetailPanelProps {
  goal: GoalItem | null;
  clusters: ClusterItem[];
  onClear: () => void;
}

export default function GoalDetailPanel({ goal, clusters, onClear }: GoalDetailPanelProps) {
  if (!goal) {
    return (
      <div id="empty-detail-panel" className="glass-panel p-8 rounded-[32px] flex flex-col items-center justify-center text-center h-[230px]">
        <div className="w-10 h-10 rounded-full bg-indigo-950/40 border border-indigo-800/45 flex items-center justify-center text-indigo-400 mb-3 animate-pulse-glowing">
          <HelpCircle className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-bold text-slate-200">Nhấp chọn mục tiêu học viên</h3>
        <p className="text-xs text-slate-400 max-w-[240px] mt-2 leading-relaxed font-semibold">
          Ấn vào bất kỳ điểm sáng lơ lửng trên Ngân hà hoặc trong danh sách mới nhất để xem chi tiết ý tưởng dự án của họ.
        </p>
      </div>
    );
  }

  const borderCol = getClusterColor(goal.cluster);
  const matchedCluster = clusters.find((c) => c.id === goal.cluster);
  const formattedDate = new Date(goal.createdAt).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });

  return (
    <div id="goal-detail-selected-panel" className="glass-panel p-8 rounded-[32px] border transition-all relative overflow-hidden" style={{ borderColor: `${borderCol}40` }}>
      {/* Small colored gradient top bar */}
      <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: borderCol }} />

      {/* Close button */}
      <button 
        onClick={onClear}
        className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-900 cursor-pointer"
        aria-label="Close detail panel"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="space-y-4">
        {/* Name and Cluster */}
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 mt-0.5" style={{ backgroundColor: borderCol }}>
            <User className="w-4 h-4" />
          </div>
          <div className="min-w-0 pr-6">
            <h3 className="text-base font-extrabold text-slate-100 truncate" id="selected-learner-name">
              {goal.name}
            </h3>
            <span
              className="inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border mt-0.5 font-mono"
              style={{
                borderColor: `${borderCol}40`,
                backgroundColor: `${borderCol}18`,
                color: borderCol
              }}
            >
              {goal.clusterLabel}
            </span>
          </div>
        </div>

        {/* The actual Goal Text */}
        <div className="bg-slate-950/40 rounded-2xl p-4.5 border border-slate-850/60">
          <label className="block text-[10px] uppercase text-indigo-400 font-bold tracking-wider mb-1.5 font-mono">
            Mục tiêu & Dự án hướng tới
          </label>
          <p className="text-sm text-slate-200 leading-relaxed font-semibold text-wrap" id="selected-learner-goal">
            {goal.goal}
          </p>
        </div>

        {/* Dynamic AI Analysis feedback if exists */}
        {goal.analysis && (
          <div className="bg-indigo-950/25 rounded-2xl p-4 border border-indigo-900/30">
            <label className="block text-[10px] uppercase text-indigo-300 font-bold tracking-wider mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              Phân tích & Định hướng AI
            </label>
            <p className="text-xs text-indigo-200 leading-relaxed font-semibold">
              {goal.analysis}
            </p>
          </div>
        )}

        {/* Chòm sao description info */}
        {matchedCluster && (
          <div className="text-xs text-slate-300 flex items-start gap-1.5 leading-relaxed font-semibold">
            <BookOpen className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
            <span>
              <strong className="text-slate-400">Nhóm chòm sao:</strong> {matchedCluster.description}
            </span>
          </div>
        )}

        {/* Tags breakdown */}
        {goal.tags && goal.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 items-center">
            <Tag className="w-3.5 h-3.5 text-slate-500 mr-0.5 shrink-0" />
            {goal.tags.map((tag, index) => (
              <span
                key={`${tag}-${index}`}
                className="text-[10px] px-2.5 py-0.5 bg-slate-900/60 border border-slate-800 text-slate-300 font-bold rounded-full font-mono"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Date tracker */}
        <div className="pt-3.5 border-t border-slate-850/80 flex items-center gap-1.5 text-[10px] text-slate-500 font-bold font-mono">
          <Calendar className="w-3 h-3 text-slate-500" />
          <span>Thời gian tham gia: {formattedDate}</span>
        </div>
      </div>
    </div>
  );
}
