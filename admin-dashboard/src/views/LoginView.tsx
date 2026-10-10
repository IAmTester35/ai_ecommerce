import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Shield,
  ShieldCheck,
  Zap,
  Sparkles,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowLeft,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ROLE_INFO } from '../lib/permissions';

export const LoginView: React.FC = () => {
  const { signIn, resetPassword, isLoading } = useAuth();

  const [mode, setMode] = useState<'login' | 'forgot_password'>('login');
  const [email, setEmail] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('email') || (import.meta.env.VITE_ADMIN_EMAIL as string) || '';
    } catch {
      return (import.meta.env.VITE_ADMIN_EMAIL as string) || '';
    }
  });
  const [password, setPassword] = useState((import.meta.env.VITE_ADMIN_PASSWORD as string) || '');
  const [resetEmail, setResetEmail] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('email') || '';
    } catch {
      return '';
    }
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const hasInvite = params.get('invite_token') || params.get('invited');
      if (hasInvite) {
        return 'Bạn đã nhận được lời mời tham gia cổng quản trị AutoMatch. Hãy dùng chức năng "Quên mật khẩu?" bên dưới để đặt mật khẩu riêng nếu đây là lần đầu truy cập.';
      }
    } catch {
      // ignore
    }
    return null;
  });

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Vui lòng điền đầy đủ email và mật khẩu quản trị.');
      return;
    }

    const res = await signIn(email, password);
    if (!res.success) {
      setErrorMessage(res.error || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!resetEmail.trim()) {
      setErrorMessage('Vui lòng nhập địa chỉ email quản trị.');
      return;
    }

    const res = await resetPassword(resetEmail);
    if (res.success) {
      setSuccessMessage(`Đã gửi liên kết khôi phục mật khẩu đến ${resetEmail.trim()}. Vui lòng kiểm tra hộp thư email.`);
    } else {
      setErrorMessage(res.error || 'Không thể gửi email khôi phục mật khẩu. Vui lòng thử lại.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4 sm:p-8 relative overflow-hidden font-sans select-none">
      {/* Ambient Luxury Atmospheric Light Beams */}
      <div className="absolute -top-32 -left-32 w-lg h-128 bg-blue-500/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-lg h-128 bg-indigo-500/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-160 h-160 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Subtle Background Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#0F172A 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
        {/* Left Column: Brand & Security Hierarchy */}
        <div className="lg:col-span-6 space-y-6 text-left">
          {/* Brand Header */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-blue-600 via-blue-700 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 shrink-0">
              <Zap className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-2xl tracking-tight text-slate-900">AutoMatch</span>
                <Badge variant="primary" size="sm" className="bg-blue-50 text-blue-700 border-blue-200/80 font-bold">
                  AI EXECUTIVE PORTAL
                </Badge>
              </div>
              <p className="text-xs text-slate-500 font-medium">Trung Tâm Quản Trị & Điều Hành Thương Mại Điện Tử Ô Tô</p>
            </div>
          </div>

          {/* Headline & Mission */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Cổng Xác Thực Quản Trị <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600">
                Bảo Mật Chuẩn Supabase RLS
              </span>
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed max-w-lg">
              Hệ thống xác thực nội bộ phân quyền 2 lớp độc quyền: <strong className="text-indigo-700">Owner (Chủ sở hữu duy nhất)</strong> và <strong className="text-blue-700">Manager (Quản lý Showroom)</strong>, tuân thủ Row Level Security không qua trung gian bypass.
            </p>
          </div>

          {/* Role Capabilities Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2 hover:border-indigo-300 transition-colors">
              <div className="flex items-center gap-2 text-indigo-700">
                <ShieldCheck className="w-4 h-4" />
                <span className="font-bold text-xs uppercase tracking-wider">Chủ Sở Hữu (Owner)</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                {ROLE_INFO.owner.description}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2 hover:border-blue-300 transition-colors">
              <div className="flex items-center gap-2 text-blue-700">
                <Shield className="w-4 h-4" />
                <span className="font-bold text-xs uppercase tracking-wider">Quản Lý Showroom</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                {ROLE_INFO.manager.description}
              </p>
            </div>
          </div>

          {/* Technical Specs Footer */}
          <div className="flex items-center gap-4 text-xs text-slate-500 pt-3 border-t border-slate-200">
            <div className="flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>pgvector HNSW</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Policy RLS Protected</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Enterprise RBAC</span>
            </div>
          </div>
        </div>

        {/* Right Column: Luxury Login / Forgot Password Form Card */}
        <div className="lg:col-span-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xl shadow-slate-200/50 space-y-6 text-left relative">
            {mode === 'login' ? (
              <>
                {/* Form Title & Context */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                      Đăng Nhập Quản Trị Viên
                    </h3>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Hệ thống sẵn sàng" />
                  </div>
                  <p className="text-xs text-slate-500">
                    Nhập email và mật khẩu tài khoản được cấp quyền để truy cập hệ thống điều hành.
                  </p>
                </div>

                {/* Error Message Notification */}
                {errorMessage && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200/80 flex items-start gap-2.5 text-xs text-rose-700 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                    <span className="leading-snug">{errorMessage}</span>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Email Quản Trị Viên *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@automatch.vn"
                        autoComplete="email"
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700 block">
                        Mật Khẩu *
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMessage(null);
                          setSuccessMessage(null);
                          setResetEmail(email.trim());
                          setMode('forgot_password');
                        }}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer transition-colors"
                      >
                        Quên mật khẩu?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-10 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                        title={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    isLoading={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/20 mt-2 py-3 cursor-pointer"
                  >
                    Đăng Nhập Vào Hệ Thống
                  </Button>
                </form>
              </>
            ) : (
              <>
                {/* Forgot Password Header */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                      Khôi Phục Mật Khẩu
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500">
                    Nhập email tài khoản quản trị để nhận liên kết xác thực đặt lại mật khẩu an toàn.
                  </p>
                </div>

                {/* Notifications */}
                {errorMessage && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200/80 flex items-start gap-2.5 text-xs text-rose-700 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                    <span className="leading-snug">{errorMessage}</span>
                  </div>
                )}

                {successMessage ? (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3.5 text-xs text-emerald-800 animate-in fade-in">
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <p className="leading-relaxed">{successMessage}</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="md"
                      onClick={() => {
                        setMode('login');
                        setSuccessMessage(null);
                        setErrorMessage(null);
                      }}
                      className="w-full text-xs font-semibold"
                    >
                      Quay lại trang Đăng nhập
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 block">
                        Email Quản Trị Viên *
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          placeholder="admin@automatch.vn"
                          autoComplete="email"
                          required
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      isLoading={isLoading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/20 mt-2 py-3 cursor-pointer"
                    >
                      Gửi Liên Kết Khôi Phục
                    </Button>

                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setErrorMessage(null);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 pt-1 cursor-pointer transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Quay lại Đăng nhập</span>
                    </button>
                  </form>
                )}
              </>
            )}

            {/* Security Notice Box */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 leading-relaxed">
              <div className="flex items-center gap-1.5 font-bold text-slate-700 mb-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Quy định An Ninh Nội Bộ</span>
              </div>
              Cổng quản trị nội bộ không hỗ trợ đăng ký công khai. Mọi tài khoản Quản trị viên Showroom mới được phân bổ và ủy quyền trực tiếp bởi Ban Giám Đốc (Owner).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
