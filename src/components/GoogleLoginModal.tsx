import React, { useState } from "react";
import { X, Shield, Lock, Sparkles, LogIn } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface GoogleLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: { email: string; name: string; alias: string }) => void;
}

const PRESET_ACCOUNTS = [
  { name: "Hoàng Vương", email: "hoangvuong21011406@gmail.com", defaultAlias: "Vương Cát Tinh" },
  { name: "Nguyễn An", email: "nguyenan.developer@gmail.com", defaultAlias: "An Diệu Linh" },
  { name: "Thanh Hằng", email: "thanhhang.builder@gmail.com", defaultAlias: "Hằng Nga AI" }
];

export default function GoogleLoginModal({ isOpen, onClose, onLoginSuccess }: GoogleLoginModalProps) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [alias, setAlias] = useState("");
  const [step, setStep] = useState<1 | 2>(1); // 1: Select Email, 2: Configure Alias
  const [customEmailMode, setCustomEmailMode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectPreset = (account: typeof PRESET_ACCOUNTS[0]) => {
    setEmail(account.email);
    setFullName(account.name);
    setAlias(account.defaultAlias);
    setStep(2);
    setError(null);
  };

  const handleCustomEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError("Vui lòng nhập định dạng email Google hợp lệ.");
      return;
    }
    const namePart = email.split("@")[0];
    const generatedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
    setFullName(generatedName);
    
    // Auto generate a cool galaxy nickname for alias
    const galaxyTitles = ["Tinh Tú", "Nguyệt Viên", "Sao Băng", "Nasa AI", "Vũ Trụ Giả", "Galaxy Builder"];
    const randomTitle = galaxyTitles[Math.floor(Math.random() * galaxyTitles.length)];
    setAlias(`${generatedName} ${randomTitle}`);
    
    setStep(2);
    setError(null);
  };

  const handleAliasSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alias.trim()) {
      setError("Vui lòng điền Bút danh / Alias hiển thị.");
      return;
    }
    setError(null);

    // Call successful callback
    onLoginSuccess({
      email: email.trim(),
      name: fullName.trim() || "Google User",
      alias: alias.trim()
    });
    
    // Reset state & close
    setTimeout(() => {
      setStep(1);
      setEmail("");
      setFullName("");
      setAlias("");
      setCustomEmailMode(false);
    }, 200);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window Container */}
        <motion.div
          initial={{ scale: 0.95, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: 20, opacity: 0 }}
          transition={{ type: "spring", duration: 0.5, bounce: 0.15 }}
          className="relative w-full max-w-md bg-slate-950 border border-indigo-500/20 rounded-[32px] overflow-hidden shadow-2xl z-10 p-7 font-sans"
        >
          {/* Top header decoration icon */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-cyan-400 via-indigo-500 to-rose-400" />
          
          {/* Close trigger */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors p-1.5 rounded-xl hover:bg-slate-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Modal Header */}
          <div className="text-center mt-3 mb-6">
            <div className="w-12 h-12 bg-indigo-950/70 border border-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-indigo-500/10 shadow-lg">
              <LogIn className="w-5 h-5 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight glowing-text">
              {step === 1 ? "Liên kết Google Account" : "Thiết lập Bút danh / Alias"}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              Hệ thống mô phỏng Google SSO giúp bảo mật danh tính & email cá nhân của bạn trong Ngân hà
            </p>
          </div>

          {/* Privacy Alert */}
          <div className="bg-indigo-950/30 border border-indigo-900/40 rounded-2xl p-4 mb-5 flex items-start gap-3">
            <Shield className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] text-cyan-200 font-semibold leading-relaxed">
                <span className="text-white font-bold">Cam kết ẩn danh tuyệt đối:</span> Email Gmail thực tế của bạn sẽ được giữ bí mật & KHÔNG hiển thị lên bất kỳ giao diện cộng đồng nào.
              </p>
            </div>
          </div>

          {step === 1 ? (
            <div className="space-y-4">
              {!customEmailMode ? (
                <>
                  <p className="text-stone-400 text-xs font-bold uppercase tracking-wider mb-2 font-mono">
                    Chọn nhanh tài khoản liên kết:
                  </p>
                  <div className="space-y-2.5">
                    {PRESET_ACCOUNTS.map((acc, index) => (
                      <button
                        key={index}
                        onClick={() => handleSelectPreset(acc)}
                        className="w-full flex items-center justify-between p-3.5 bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-indigo-500/40 rounded-2xl cursor-pointer text-left transition-all"
                      >
                        <div className="flex items-center gap-3">
                          {/* Simulated Avatar Grid */}
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white font-bold text-xs ring-2 ring-slate-800">
                            {acc.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-200">{acc.name}</p>
                            <p className="text-[10px] text-slate-500 font-mono">{acc.email}</p>
                          </div>
                        </div>
                        <div className="text-[10px] bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 font-mono text-cyan-400 font-semibold">
                          {acc.defaultAlias}
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="relative my-4 flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-900"></div>
                    </div>
                    <span className="relative z-10 px-3 bg-slate-950 text-[10px] text-slate-500 uppercase tracking-widest font-bold font-mono">
                      Hoặc
                    </span>
                  </div>

                  <button
                    onClick={() => setCustomEmailMode(true)}
                    className="w-full py-3 bg-slate-900/30 hover:bg-slate-900/60 border border-dashed border-slate-800 text-xs font-bold text-slate-300 rounded-2xl cursor-pointer transition-all hover:text-white"
                  >
                    Dùng tài khoản Google thủ công của bạn
                  </button>
                </>
              ) : (
                <form onSubmit={handleCustomEmailSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5 font-mono">
                      Nhập địa chỉ Gmail Google của bạn
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="ten.ban@gmail.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError(null);
                      }}
                      className="w-full bg-slate-900/60 text-slate-100 placeholder:text-slate-600 border border-slate-800 focus:border-indigo-500 outline-none rounded-2xl px-4 py-3.5 text-xs transition-all font-mono"
                    />
                  </div>

                  {error && (
                    <div className="text-[10px] text-rose-400 font-bold font-mono leading-relaxed bg-rose-950/20 p-2.5 rounded-xl border border-rose-900/20">
                      ⚠️ {error}
                    </div>
                  )}

                  <div className="flex gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCustomEmailMode(false);
                        setError(null);
                      }}
                      className="flex-1 py-3 border border-slate-800 hover:bg-slate-900/60 text-slate-400 hover:text-white cursor-pointer rounded-2xl text-xs font-bold transition-all"
                    >
                      Quay lại
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer rounded-2xl text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all"
                    >
                      Tiếp tục thiết lập
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <form onSubmit={handleAliasSubmit} className="space-y-4">
              <div className="bg-slate-900/40 p-4 border border-slate-850 rounded-2xl space-y-1">
                <p className="text-[10px] uppercase text-slate-500 font-bold font-mono">Tài khoản liên kết:</p>
                <p className="text-xs text-white font-bold leading-none">{fullName}</p>
                <p className="text-[10px] text-slate-400 font-mono">{email}</p>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5 font-mono flex justify-between">
                  <span>Đặt Bút danh hiển thị (Alias)</span>
                  <span className="text-indigo-400 shrink-0 select-none font-semibold">Tên hiển thị công cộng</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={50}
                  placeholder="Ví dụ: Hoàng Vũ Trụ, Coder Khuyết Danh..."
                  value={alias}
                  onChange={(e) => {
                    setAlias(e.target.value);
                    if (error) setError(null);
                  }}
                  className="w-full bg-slate-900/60 text-slate-100 placeholder:text-slate-600 border border-slate-800 focus:border-indigo-500 outline-none rounded-2xl px-4 py-3.5 text-xs transition-all font-semibold"
                />
                <p className="text-[9px] text-slate-500 mt-1 leading-relaxed">
                  💡 Đây là bút danh duy nhất hiển thị trên Bản đồ 3D Ngân hà và SidePanel cộng đồng. Thay đổi alias để giữ an toàn tuyệt đối, không lộ danh tính thật.
                </p>
              </div>

              {error && (
                <div className="text-[10px] text-rose-400 font-bold font-mono leading-relaxed bg-rose-950/20 p-2.5 rounded-xl border border-rose-900/20">
                  ⚠️ {error}
                </div>
              )}

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setError(null);
                  }}
                  className="flex-1 py-3 border border-slate-800 hover:bg-slate-900/60 text-slate-400 hover:text-white cursor-pointer rounded-2xl text-xs font-bold transition-all"
                >
                  Trở lại bước 1
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer rounded-2xl text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
                  Kích hoạt Thiên Hà
                </button>
              </div>
            </form>
          )}

          {/* Dialog Footer warning */}
          <div className="mt-6 pt-4 border-t border-slate-900/80 text-center flex items-center justify-center gap-1 text-[9px] text-slate-650 font-semibold uppercase tracking-wider font-mono">
            <Lock className="w-3 h-3 text-slate-500" />
            <span>Mã hóa bảo mật danh tính bởi Google Identity Service</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
