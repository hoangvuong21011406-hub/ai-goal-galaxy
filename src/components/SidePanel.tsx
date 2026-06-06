import React from "react";
import { Download, BarChart2, MessageSquare, Flame } from "lucide-react";
import { GoalItem, ClusterItem } from "../types";
import { getClusterColor } from "./GalaxyScene";

interface SidePanelProps {
  goals: GoalItem[];
  clusters: ClusterItem[];
  onSelectGoal: (goal: GoalItem) => void;
  selectedGoalId: string | null;
}

export default function SidePanel({ goals, clusters, onSelectGoal, selectedGoalId }: SidePanelProps) {
  // Compute counts
  const totalSubmissions = goals.length;

  // Calculate unique student headcount across the course
  const uniqueStudentsSet = new Set(
    goals.map((g) => (g.email && g.email.trim() ? g.email.trim().toLowerCase() : g.name.trim().toLowerCase()))
  );
  const totalStudentsCount = uniqueStudentsSet.size;

  // Count unique students per constellation cluster
  const clusterUniqueStudents = goals.reduce<Record<string, Set<string>>>((acc, item) => {
    if (!acc[item.cluster]) {
      acc[item.cluster] = new Set<string>();
    }
    const key = item.email && item.email.trim()
      ? item.email.trim().toLowerCase()
      : item.name.trim().toLowerCase();
    acc[item.cluster].add(key);
    return acc;
  }, {});

  // Sort clusters by unique student count to find top ones
  const activeClustersSorted = [...clusters].map((c) => {
    const studentSet = clusterUniqueStudents[c.id] || new Set();
    return {
      ...c,
      count: studentSet.size,
      color: getClusterColor(c.id)
    };
  }).sort((a, b) => b.count - a.count);

  // Recent 5 goals
  const recentGoals = goals.slice(0, 5);

  const handleExport = async () => {
    try {
      window.open("/api/goals/export", "_blank");
    } catch (err) {
      // client-side backup export
      const fileData = {
        courseName: "AI Builder Course",
        items: goals,
        exportedAt: new Date().toISOString()
      };
      const json = JSON.stringify(fileData, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const href = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = href;
      link.download = "ai-goal-galaxy-export.json";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-6" id="dashboard-statistics-sidebar">
      {/* 1. Global twin statistics cards */}
      <div className="grid grid-cols-2 gap-3.5">
        {/* Total Unique Students */}
        <div className="glass-panel p-4.5 rounded-[22px] bg-slate-900/30 border border-slate-900/80 flex flex-col justify-between h-24">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold font-mono">
            Tổng học viên
          </p>
          <div className="flex items-baseline gap-1 mt-1">
            <h3 className="text-2xl md:text-3xl font-black text-emerald-400 font-mono tracking-tight glowing-text" id="unique-students-count">
              {totalStudentsCount}
            </h3>
            <span className="text-[10px] text-slate-400 font-bold">bút danh</span>
          </div>
        </div>

        {/* Total Submissions */}
        <div className="glass-panel p-4.5 rounded-[22px] bg-slate-900/30 border border-slate-900/80 flex flex-col justify-between h-24">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold font-mono">
            Tổng mục tiêu
          </p>
          <div className="flex items-baseline gap-1 mt-1">
            <h3 className="text-2xl md:text-3xl font-black text-teal-300 font-mono tracking-tight" id="total-registrations-count">
              {totalSubmissions}
            </h3>
            <span className="text-[10px] text-slate-400 font-bold">ý tưởng</span>
          </div>
        </div>
      </div>

      {/* 2. Clusters Breakdown with elegant progress indicators */}
      <div className="glass-panel p-6 rounded-[32px] bg-slate-900/30">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-orange-950/40 border border-orange-900/30 flex items-center justify-center text-orange-400 shrink-0">
            <Flame className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider font-mono">
            Phân bố chòm sao
          </h4>
        </div>
        <div className="space-y-3.5" id="charts-cluster-bars">
          {activeClustersSorted.map((cluster) => {
            const pct = totalStudentsCount > 0 ? (cluster.count / totalStudentsCount) * 100 : 0;
            return (
              <div key={cluster.id} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-200 flex items-center gap-1.5 font-bold truncate max-w-[140px]" title={cluster.name}>
                    <span 
                      className="w-2.5 h-2.5 rounded-full inline-block shrink-0" 
                      style={{ backgroundColor: cluster.color }}
                    />
                    {cluster.name}
                  </span>
                  <span className="text-slate-400 font-mono font-bold shrink-0">
                    {cluster.count} {cluster.count > 0 ? "HV" : "HV"} ({Math.round(pct)}%)
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-950/80 rounded-full overflow-hidden border border-white/5">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      backgroundColor: cluster.color,
                      width: `${pct || 1}%`,
                      boxShadow: `0 0 8px ${cluster.color}`
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Recent 5 Submissions */}
      <div className="glass-panel p-6 rounded-[32px] bg-slate-900/30">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-emerald-950/40 border border-emerald-900/30 flex items-center justify-center text-emerald-400 shrink-0">
            <MessageSquare className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider font-mono">
            Đăng ký mới nhất
          </h4>
        </div>

        {recentGoals.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4 font-semibold">Chưa có ai đăng ký</p>
        ) : (
          <div className="space-y-2.5" id="recent-goals-list">
            {recentGoals.map((g) => {
              const borderCol = getClusterColor(g.cluster);
              const isSelected = selectedGoalId === g.id;
              return (
                <div
                  key={g.id}
                  onClick={() => onSelectGoal(g)}
                  className={`p-3.5 rounded-2xl hover:bg-slate-900/60 cursor-pointer border transition-all ${
                    isSelected 
                      ? "bg-slate-950/85 border-indigo-500 shadow-md shadow-indigo-600/5" 
                      : "bg-slate-950/20 border-slate-900/70"
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-100 truncate max-w-[140px]">
                      {g.name}
                    </span>
                    <span
                      className="text-[9px] px-2 py-0.5 rounded border font-mono font-bold shrink-0"
                      style={{
                        borderColor: `${borderCol}50`,
                        backgroundColor: `${borderCol}18`,
                        color: borderCol
                      }}
                    >
                      {g.clusterLabel}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed font-semibold">
                    {g.goal}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Export button */}
      <button
        id="btn-export-json"
        onClick={handleExport}
        className="w-full bg-slate-950 border border-slate-900 hover:border-indigo-900 px-4 py-3 rounded-2xl text-xs font-bold text-slate-300 hover:text-white cursor-pointer flex items-center justify-center gap-2 shadow-md hover:shadow-indigo-900/10 transition-all mt-4"
      >
        <Download className="w-3.5 h-3.5 text-indigo-400" />
        Xuất dữ liệu JSON (Export)
      </button>
    </div>
  );
}
