import React, { useState, useEffect } from "react";
import { User, Sparkles, Send, ShieldCheck, BadgeCheck, LogIn } from "lucide-react";

interface GoalFormProps {
  onSubmit: (name: string, goal: string) => Promise<boolean>;
  isSubmitting: boolean;
  user: { name: string; email: string; alias: string } | null;
  onPromptLogin: () => void;
}

export default function GoalForm({ onSubmit, isSubmitting, user, onPromptLogin }: GoalFormProps) {
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const goalMaxLength = 500;
  const nameMaxLength = 80;

  // Auto-sync form's name with Google user's secure alias if logged in
  useEffect(() => {
    if (user) {
      setName(user.alias);
    } else {
      setName("");
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const trimmedName = name.trim();
    const trimmedGoal = goal.trim();

    if (!trimmedName) {
      setError("Vui lòng nhập tên hoặc đăng nhập Google để lấy Alias hiển thị.");
      return;
    }
    if (!trimmedGoal) {
      setError("Vui lòng nhập mục tiêu/ý tưởng của bạn.");
      return;
    }

    if (trimmedName.length > nameMaxLength) {
      setError(`Bút danh không được vượt quá ${nameMaxLength} ký tự.`);
      return;
    }
    if (trimmedGoal.length > goalMaxLength) {
      setError(`Mục tiêu không được vượt quá ${goalMaxLength} ký tự.`);
      return;
    }

    const ok = await onSubmit(trimmedName, trimmedGoal);
    if (ok) {
      setGoal(""); // clear the goal input as requested
      setSuccess(true);
      setError(null);
      setTimeout(() => setSuccess(false), 3500);
    } else {
      setError("Có lỗi xảy ra khi lưu mục tiêu. Vui lòng thử lại!");
    }
  };

  return (
    <div id="goal-form-section" className="glass-panel p-8 rounded-[32px]">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-lg bg-indigo-950/60 flex items-center justify-center text-indigo-400 shrink-0 border border-indigo-800/40">
          <Sparkles className="w-4 h-4 animate-pulse-glowing" />
        </div>
        <h2 className="text-lg font-bold text-white tracking-tight glowing-text">
          Đăng ký mục tiêu của bạn
        </h2>
      </div>

      <p className="text-xs text-slate-400 mb-5 leading-relaxed font-semibold">
        Nhập ý tưởng sản phẩm hoặc mục tiêu bạn mong muốn đạt được. AI sẽ tự động phân tích và gắn vị trí của bạn vào chòm sao thích hợp của ngân hà!
      </p>

      {/* Google Sign-in CTA banner if not logged in */}
      {!user && (
        <div className="mb-5 p-3.5 bg-indigo-950/40 border border-indigo-800/30 rounded-2xl flex flex-col gap-2.5">
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p className="text-[10px] text-cyan-200 font-semibold leading-relaxed">
              Bạn chưa liên kết Google Account? Đăng nhập để tự động bảo mật Email và thiết lập bút danh (Alias) hiển thị trên tinh cầu!
            </p>
          </div>
          <button
            type="button"
            onClick={onPromptLogin}
            className="w-full py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl text-[10px] font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20"
          >
            <LogIn className="w-3.5 h-3.5" />
            Liên kết Google / Đặt Alias ngay
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-[11px] uppercase tracking-wider text-slate-450 font-bold flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-indigo-400" /> Tên hiển thị / Học viên
            </label>
            {user && (
              <span className="flex items-center gap-1 text-[9px] text-emerald-400 font-bold uppercase tracking-wider bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-900/30 font-mono">
                <BadgeCheck className="w-3 h-3 text-emerald-400" /> Google Verified
              </span>
            )}
          </div>
          
          <div className="relative">
            <input
              type="text"
              id="input-name"
              placeholder={user ? user.alias : "🔒 Cần đăng nhập Google lấy bút danh"}
              value={name}
              onChange={(e) => {
                if (user) return; // Locked to Google Alias if logged in
                setName(e.target.value);
                if (error) setError(null);
              }}
              maxLength={nameMaxLength}
              disabled={isSubmitting || !user}
              className={`w-full bg-slate-950/45 text-slate-100 placeholder:text-slate-650 border border-slate-800/85 rounded-2xl px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:bg-slate-900/60 transition-all font-sans font-medium ${
                !user ? "opacity-50 cursor-not-allowed bg-slate-950/20" : "bg-indigo-950/15 border-indigo-900/55 text-indigo-200 font-bold shadow-indigo-900/5 shadow-inner cursor-not-allowed"
              }`}
            />
          </div>
          
          <div className="flex justify-between text-[10px] text-slate-500 font-medium mt-1">
            <span>
              {user ? "🔒 Đang bảo mật bởi Google Alias" : "⚠️ Cần đăng nhập Google để định danh"}
            </span>
            <span>
              {name.length} / {nameMaxLength} ký tự
            </span>
          </div>
        </div>

        <div>
          <label className="block text-[11px] uppercase tracking-wider text-slate-450 font-bold mb-1.5">
            Mục tiêu hoặc Công cụ muốn phát triển
          </label>
          <textarea
            id="input-goal"
            rows={4}
            placeholder={user ? "Ví dụ: Mình muốn tự xây dựng một Chatbot tự động trả lời tư vấn khách hàng trên Zalo và Messenger để hỗ trợ kinh doanh thời trang..." : "🔒 Vui lòng đăng nhập Google để chia sẻ mục tiêu học tập..."}
            value={goal}
            onChange={(e) => {
              setGoal(e.target.value);
              if (error) setError(null);
            }}
            maxLength={goalMaxLength}
            disabled={isSubmitting || !user}
            className={`w-full bg-slate-950/45 text-slate-100 placeholder:text-slate-650 border border-slate-800/85 rounded-2xl px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:bg-slate-900/60 transition-all resize-none font-sans font-medium leading-relaxed ${
              !user ? "opacity-50 cursor-not-allowed bg-slate-950/20" : ""
            }`}
          />
          <div className="flex justify-between items-center text-[10px] text-slate-500 font-medium mt-1">
            <span>
              💡 Gợi ý: nhập từ khóa "chatbot", "content"...
            </span>
            <span>
              {goal.length} / {goalMaxLength} ký tự
            </span>
          </div>
        </div>

        {error && (
          <div id="form-error-msg" className="text-xs bg-red-950/30 border border-red-900/40 text-red-300 p-3.5 rounded-2xl font-semibold">
            {error}
          </div>
        )}

        {success && (
          <div id="form-success-msg" className="text-xs bg-emerald-950/30 border border-emerald-900/40 text-emerald-300 p-3.5 rounded-2xl font-bold border-glow">
            ✨ Bạn đã được đưa lên ngân hà thành công! Tìm chấm sáng của bạn nhé.
          </div>
        )}

        {!user ? (
          <button
            type="button"
            id="btn-login-to-add"
            onClick={onPromptLogin}
            className="w-full bg-gradient-to-r from-teal-500 via-indigo-600 to-violet-700 hover:from-teal-450 hover:via-indigo-550 hover:to-violet-650 text-white py-4 rounded-2xl text-sm font-extrabold tracking-wider transition-all duration-300 shadow-xl shadow-indigo-600/20 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 text-center"
          >
            <LogIn className="w-4 h-4 animate-pulse" />
            <span>Kết nối Google để gửi Mục tiêu</span>
          </button>
        ) : (
          <button
            type="submit"
            id="btn-add-to-galaxy"
            disabled={isSubmitting}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 shadow-lg shadow-indigo-600/30 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 text-center"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Bay vào Ngân Hà</span>
              </>
            )}
          </button>
        )}
      </form>
    </div>
  );
}
