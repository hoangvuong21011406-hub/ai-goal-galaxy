import React, { useState, useEffect } from "react";
import { Sparkles, RefreshCw, Layers, Database, Eye, EyeOff, LogIn, LogOut, ChevronDown, BadgeCheck, Sun, Moon } from "lucide-react";
import { GoalItem, ClusterItem } from "./types";
import GoalForm from "./components/GoalForm";
import GalaxyScene from "./components/GalaxyScene";
import SidePanel from "./components/SidePanel";
import GoalDetailPanel from "./components/GoalDetailPanel";
import GoogleLoginModal from "./components/GoogleLoginModal";

export default function App() {
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [clusters, setClusters] = useState<ClusterItem[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<GoalItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Google Authenticated User Session properties
  const [user, setUser] = useState<{ email: string; name: string; alias: string } | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [showControlPanels, setShowControlPanels] = useState(true);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Restore session from localStorage on load
  useEffect(() => {
    const saved = localStorage.getItem("galaxy_google_session");
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch (err) {
        localStorage.removeItem("galaxy_google_session");
      }
    }
  }, []);
  
  // Sync class on document root for light theme support
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
    }
  }, [isDarkMode]);

  const handleLoginSuccess = (userData: { email: string; name: string; alias: string }) => {
    setUser(userData);
    localStorage.setItem("galaxy_google_session", JSON.stringify(userData));
    setIsLoginModalOpen(false);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("galaxy_google_session");
    setShowProfileDropdown(false);
  };

  // Fetch initial goals on mount
  const fetchGoals = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/goals");
      if (!response.ok) {
        throw new Error("Không thể kết nối đến máy chủ");
      }
      const data = await response.json();
      setGoals(data.items || []);
      setClusters(data.clusters || []);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError("Không thể tải sơ đồ chòm sao mục tiêu. Đang sử dụng chế độ dự phòng!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleSubmitGoal = async (name: string, goal: string): Promise<boolean> => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, goal, email: user?.email || "" }),
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || "Gửi mục tiêu thất bại");
      }

      const addedItem: GoalItem = await response.json();
      
      // Auto-select the newly added target to show interactive detail
      setSelectedGoal(addedItem);

      // Re-fetch everything to load newly spawned constellations
      await fetchGoals();
      return true;
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Gửi mục tiêu thất bại!");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetDatabase = async () => {
    if (window.confirm("Bạn có chắc chắn muốn đặt lại ngân hà về danh sách 10 học viên mẫu ban đầu không?")) {
      try {
        const response = await fetch("/api/goals/reset", { method: "POST" });
        if (response.ok) {
          const resJson = await response.json();
          setGoals(resJson.data.items || []);
          setClusters(resJson.data.clusters || []);
          setSelectedGoal(null);
          alert("Đã đặt lại ngân hà về chế độ ban đầu!");
        }
      } catch (err) {
        alert("Khôi phục thất bại!");
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-200 bg-[#030308]" id="applet-main-wrapper">
      {/* 1. Header Toolbar */}
      <header className="px-4 md:px-8 py-5 border-b border-slate-900 bg-slate-950/45 backdrop-blur-md shrink-0 shadow-lg mb-1">
        <div className="w-full mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-600/30 animate-pulse-glowing">
              🚀
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight glowing-text">
                  AI Goal Galaxy
                </h1>
                <span className="text-[10px] bg-indigo-950/60 text-indigo-300 font-bold px-2.5 py-0.5 rounded-full border border-indigo-800/50 font-mono uppercase">
                  v2.0 Orchestrator
                </span>
              </div>
              <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                Khóa học AI Builder • Bản đồ 3D Ngân Hà ý tưởng học viên kiến tạo động bởi mô hình Gemini LLM
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
            {/* View Toggle Controller */}
            <button
              onClick={() => setShowControlPanels(!showControlPanels)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold cursor-pointer border flex items-center gap-1.5 transition-all shadow-md ${
                showControlPanels
                  ? "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800 hover:text-white"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-700 hover:border-indigo-600 animate-pulse-glowing"
              }`}
              title={showControlPanels ? "Ẩn bảng chức năng" : "Hiện bảng chức năng"}
            >
              {showControlPanels ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Ẩn bảng điều khiển</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>Hiện bảng điều khiển</span>
                </>
              )}
            </button>

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-2xl text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all shadow-md"
              title={isDarkMode ? "Chuyển sang giao diện Sáng" : "Chuyển sang giao diện Tối"}
            >
              {isDarkMode ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Giao diện Sáng</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Giao diện Tối</span>
                </>
              )}
            </button>

            {/* Separator */}
            <div className="h-6 w-px bg-slate-900 hidden sm:block" />

            {/* Google Authentication Control */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="px-3.5 py-1.5 bg-indigo-950/30 hover:bg-indigo-950/55 border border-indigo-500/20 rounded-2xl text-xs font-bold text-slate-200 flex items-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-400 to-indigo-600 flex items-center justify-center text-[10px] text-white font-extrabold ring-1 ring-indigo-500/30">
                    {user.alias.charAt(0)}
                  </div>
                  <span className="max-w-[110px] truncate block font-mono text-cyan-200">
                    {user.alias}
                  </span>
                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {showProfileDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-slate-950 border border-slate-800 rounded-2xl p-2.5 shadow-2xl z-40 space-y-1.5">
                    <div className="p-2 border-b border-slate-900">
                      <p className="text-[10px] uppercase text-slate-500 font-bold font-mono">Đang Đăng Nhập:</p>
                      <p className="text-xs text-slate-100 font-bold truncate mt-0.5">{user.name}</p>
                      <p className="text-[9px] text-indigo-400 truncate font-mono mt-0.5">Gmail: •••••••@gmail.com (Đã Ẩn)</p>
                    </div>
                    <button
                      onClick={() => {
                        setIsLoginModalOpen(true);
                        setShowProfileDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-slate-900 font-bold text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer flex items-center gap-2"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      Thay đổi Alias hiển thị
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-rose-950/20 text-rose-300 hover:text-rose-200 rounded-xl transition-all cursor-pointer flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-500" />
                      Đăng xuất Google
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 border border-indigo-700 text-white rounded-2xl text-xs font-bold cursor-pointer transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20"
              >
                <div className="w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center font-extrabold text-[9px] text-indigo-800">
                  G
                </div>
                Đăng nhập bằng Google
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. Main Content Layout (Responsive & Fluid Full-Width) */}
      <main className="flex-grow w-full max-w-none px-4 md:px-8 py-4 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 lg:h-[calc(100vh-140px)] overflow-y-auto lg:overflow-hidden relative">
        
        {/* Left column (Forms and selected details) - size 3 on large */}
        <div className={`${showControlPanels ? "lg:col-span-3" : "hidden"} space-y-6 flex flex-col justify-start overflow-y-auto max-h-full pr-1`}>
          <GoalForm 
            onSubmit={handleSubmitGoal} 
            isSubmitting={isSubmitting} 
            user={user} 
            onPromptLogin={() => setIsLoginModalOpen(true)} 
          />
          <GoalDetailPanel goal={selectedGoal} clusters={clusters} onClear={() => setSelectedGoal(null)} />
        </div>

        {/* Center column (Canvas/3D Galaxy viewport) - dynamic size */}
        <div id="canvas-main-panel" className={`${
          showControlPanels ? "lg:col-span-6" : "lg:col-span-12"
        } glass-panel rounded-[32px] overflow-hidden min-h-[450px] lg:min-h-0 lg:h-full flex flex-col relative border border-slate-900 shadow-xl bg-slate-950 transition-all duration-300`}>
          
          {loading && (
            <div className="absolute inset-0 z-20 bg-slate-950/75 backdrop-blur-md flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
              <p className="text-sm font-semibold text-slate-200">Đang khởi tạo ngân hà 3D...</p>
              <p className="text-xs text-slate-500 mt-1">Đang thiết lập thuật toán rà quét chòm sao động</p>
            </div>
          )}

          {error && !loading && (
            <div className="absolute top-4 left-4 right-4 z-20 p-3.5 bg-red-950/50 border border-red-900/30 rounded-2xl text-xs text-red-300 flex justify-between items-center font-bold">
              <span>⚠️ {error}</span>
              <button onClick={fetchGoals} className="underline hover:text-red-400 cursor-pointer ml-2">Thử lại</button>
            </div>
          )}

          {/* Floating UI Toggle directly on canvas inside visual HUD */}
          <div className="absolute top-4 left-4 z-30 flex items-center gap-2">
            <button
              onClick={() => setShowControlPanels(!showControlPanels)}
              className="px-4 py-2.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white rounded-2xl text-xs font-bold border border-slate-850 flex items-center gap-2 shadow-xl backdrop-blur-md cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
              title={showControlPanels ? "Xem toàn cảnh ngân hà không giao diện" : "Hiện lại các cột chức năng"}
            >
              {showControlPanels ? (
                <>
                  <EyeOff className="w-4 h-4 text-indigo-400" />
                  <span className="hidden sm:inline">Ẩn các bảng chức năng (Toàn cảnh)</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span className="glowing-text">Hiện Bảng Điều Khiển</span>
                </>
              )}
            </button>
          </div>

          {/* Interactive Three canvas */}
          <div className="flex-grow w-full relative">
            <GalaxyScene
              goals={goals}
              clusters={clusters}
              selectedGoalId={selectedGoal?.id || null}
              onSelectGoal={(item) => setSelectedGoal(item)}
            />
          </div>

          {/* HUD Footer Overlay inside 3D environment */}
          <div className="absolute bottom-4 right-4 bg-slate-900/85 px-4 py-2 rounded-2xl border border-white/5 pointer-events-none select-none text-[10px] text-slate-300 font-mono flex items-center gap-2 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping inline-block" />
            <span>Chế độ: Bản đồ 3D chuyển động chậm • {goals.length} tinh cầu mục tiêu</span>
          </div>
        </div>

        {/* Right column (Submissions list & statistics) - size 3 on large */}
        <div className={`${showControlPanels ? "lg:col-span-3" : "hidden"} overflow-y-auto max-h-full pl-1`}>
          <SidePanel
            goals={goals}
            clusters={clusters}
            onSelectGoal={(item) => setSelectedGoal(item)}
            selectedGoalId={selectedGoal?.id || null}
          />
        </div>

      </main>

       {/* 3. Small Humble Footer */}
      <footer className="py-5 text-center border-t border-slate-900 bg-slate-950/25 text-[10px] text-slate-500 font-bold font-mono shrink-0">
        <p>© 2026 AI Builder Course • Thắp sáng ước mơ công nghệ bằng trí tuệ nhân tạo • Gmail được giữ bí mật tuyệt đối</p>
      </footer>

      {/* Google Sign-in Interactive Dialog */}
      <GoogleLoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        onLoginSuccess={handleLoginSuccess} 
      />
    </div>
  );
}
