import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Zap,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  LogOut,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import type { UserRole } from '../types';

interface AcceptInviteViewProps {
  onDismiss?: () => void;
}

export const AcceptInviteView: React.FC<AcceptInviteViewProps> = ({ onDismiss }) => {
  const { currentUser, isAuthenticated, signOut, signUpAdmin, signIn, isLoading } = useAuth();

  const queryParams = new URLSearchParams(window.location.search);
  const invitedEmail = queryParams.get('email') || '';
  const invitedRole = (queryParams.get('role') as UserRole) || 'manager';

  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already logged in with another account
  const isDifferentUser = isAuthenticated && currentUser && currentUser.email.toLowerCase() !== invitedEmail.toLowerCase();

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!password || password.length < 6) {
      setErrorMsg('Mật khẩu phải chứa ít nhất 6 ký tự.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Try signUpAdmin
      const signUpRes = await signUpAdmin(
        invitedEmail,
        password,
        fullName.trim() || 'Thành Viên Mới',
        invitedRole
      );

      if (!signUpRes.success) {
        // If user might already be registered in auth.users, try signIn directly
        const signInRes = await signIn(invitedEmail, password);
        if (!signInRes.success) {
          setErrorMsg(signUpRes.error || signInRes.error || 'Không thể kích hoạt tài khoản. Vui lòng kiểm tra lại.');
          setIsSubmitting(false);
          return;
        }
      }

      // Cleanup invite from local pending list if present
      try {
        const stored = localStorage.getItem('automatch_pending_invites');
        if (stored) {
          const list = JSON.parse(stored);
          const filtered = list.filter((item: { email: string }) => item.email.toLowerCase() !== invitedEmail.toLowerCase());
          localStorage.setItem('automatch_pending_invites', JSON.stringify(filtered));
        }
      } catch {
        // ignore
      }

      // Clean URL params and enter dashboard
      window.history.replaceState({}, document.title, window.location.pathname);
      window.location.reload();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Có lỗi xảy ra khi kích hoạt tài khoản.');
      setIsSubmitting(false);
    }
  };

  const handleSwitchAccount = async () => {
    await signOut();
  };

  const handleIgnore = () => {
    window.history.replaceState({}, document.title, window.location.pathname);
    if (onDismiss) {
      onDismiss();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4 sm:p-8 relative overflow-hidden font-sans select-none">
      {/* Ambient Atmospheric Beams */}
      <div className="absolute -top-32 -left-32 w-lg h-128 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-lg h-128 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#0F172A 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      <div className="w-full max-w-lg relative z-10 text-left">
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-2xl shadow-slate-200/70 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-blue-600 via-blue-700 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 shrink-0">
              <Zap className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">AutoMatch</span>
                <Badge variant="primary" size="sm" className="font-bold">
                  INVITATION
                </Badge>
              </div>
              <p className="text-xs text-slate-500">Cổng Tiếp Nhận & Kích Hoạt Tài Khoản Quản Trị</p>
            </div>
          </div>

          {/* Conflict Banner when already logged in as someone else */}
          {isDifferentUser ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-800">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>Xung đột phiên làm việc</span>
                </div>
                <p className="leading-relaxed">
                  Trình duyệt của bạn đang đăng nhập tài khoản:{' '}
                  <strong className="text-slate-900">{currentUser?.email}</strong>.
                </p>
                <p className="leading-relaxed text-[11px] text-amber-700">
                  Để kích hoạt lời mời dành riêng cho email{' '}
                  <strong className="text-indigo-700">{invitedEmail}</strong>, bạn cần đăng xuất tài khoản hiện tại hoặc mở tab ẩn danh.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full justify-center bg-indigo-600 hover:bg-indigo-700"
                  leftIcon={<LogOut className="w-4 h-4" />}
                  onClick={handleSwitchAccount}
                >
                  Đăng Xuất & Kích Hoạt Lời Mời Này
                </Button>

                <Button
                  variant="outline"
                  size="md"
                  className="w-full justify-center text-xs"
                  onClick={handleIgnore}
                >
                  Bỏ Qua & Tiếp Tục Dùng Tài Khoản Hiện Tại
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Context Box */}
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                    Thông tin phân quyền được cấp
                  </span>
                  <Badge variant={invitedRole === 'owner' ? 'primary' : invitedRole === 'manager' ? 'secondary' : 'neutral'} size="sm">
                    {invitedRole === 'owner' ? 'CHỦ SỞ HỮU' : invitedRole === 'manager' ? 'QUẢN LÝ SHOWROOM' : 'KHÁCH HÀNG VIP'}
                  </Badge>
                </div>
                <div className="text-xs text-slate-700 flex items-center gap-2 font-semibold">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span>{invitedEmail || 'Đang xác thực liên kết...'}</span>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200/80 flex items-start gap-2.5 text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Activation Form */}
              <form onSubmit={handleActivate} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Họ & Tên Của Bạn *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="VD: Nguyễn Văn A"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Thiết Lập Mật Khẩu Đăng Nhập *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Tối thiểu 6 ký tự"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-10 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Xác Nhận Lại Mật Khẩu *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu vừa đặt"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isSubmitting || isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 mt-2 shadow-md shadow-blue-500/20"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Kích Hoạt Tài Khoản & Vào Hệ Thống
                </Button>
              </form>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Bảo mật chuẩn mã hóa phân quyền Supabase RLS</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
