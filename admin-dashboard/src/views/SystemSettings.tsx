import React, { useState, useEffect, useCallback } from 'react';
import {
  Database,
  Server,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { checkSupabaseConnection } from '../lib/supabase';
import { checkBackendHealth } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { ROLE_INFO } from '../lib/permissions';

export const SystemSettings: React.FC = () => {
  const { cars, orders, showrooms, vouchers, customers, reviews, refreshData } = useData();
  const { role, isOwner } = useAuth();
  const { success } = useToast();

  const [isCheckingSupabase, setIsCheckingSupabase] = useState(false);
  const [supabaseStatus, setSupabaseStatus] = useState<{ connected: boolean; message: string } | null>(null);

  const [isCheckingBackend, setIsCheckingBackend] = useState(false);
  const [backendStatus, setBackendStatus] = useState<{
    status: 'online' | 'offline';
    latencyMs?: number;
    details?: string;
  } | null>(null);

  const testConnections = useCallback(async () => {
    setIsCheckingSupabase(true);
    const sb = await checkSupabaseConnection();
    setSupabaseStatus(sb);
    setIsCheckingSupabase(false);

    setIsCheckingBackend(true);
    const be = await checkBackendHealth();
    setBackendStatus(be);
    setIsCheckingBackend(false);
  }, []);

  useEffect(() => {
    let active = true;
    const run = async () => {
      const sb = await checkSupabaseConnection();
      const be = await checkBackendHealth();
      if (active) {
        setSupabaseStatus(sb);
        setBackendStatus(be);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, []);

  const handleFullRefresh = async () => {
    await refreshData();
    await testConnections();
    success('Đồng bộ hệ thống hoàn tất', 'Dữ liệu toàn bộ bảng đã được làm mới từ Supabase.');
  };

  const currentRoleInfo = role ? ROLE_INFO[role] : ROLE_INFO.manager;

  return (
    <div className="space-y-8 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-1">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Cấu Hình & Kết Nối Hệ Thống
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal">
            Giám sát trạng thái Supabase PostgreSQL, FastAPI AI Core và phân quyền RLS
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="md"
            leftIcon={<RefreshCw className={`w-4 h-4 ${isCheckingSupabase || isCheckingBackend ? 'animate-spin' : ''}`} />}
            onClick={testConnections}
            isLoading={isCheckingSupabase || isCheckingBackend}
          >
            Kiểm Tra Kết Nối
          </Button>

          <Button
            variant="primary"
            size="md"
            leftIcon={<RotateCcw className="w-4 h-4" />}
            onClick={handleFullRefresh}
          >
            Đồng Bộ Lại DB
          </Button>
        </div>
      </div>

      {/* Live Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5">
        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/70 shadow-[0_2px_12px_-2px_rgba(15,23,42,0.04)] space-y-1 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block truncate">Xe Trong Kho</span>
            <p className="font-extrabold text-xl text-slate-900 mt-1">{cars.length.toLocaleString('vi-VN')}</p>
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold block pt-1">Live PostgreSQL</span>
        </div>

        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/70 shadow-[0_2px_12px_-2px_rgba(15,23,42,0.04)] space-y-1 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block truncate">Đánh Giá (RAG)</span>
            <p className="font-extrabold text-xl text-indigo-600 mt-1">{reviews.length.toLocaleString('vi-VN')}</p>
          </div>
          <span className="text-[10px] text-indigo-600 font-semibold block pt-1">pgvector 768d</span>
        </div>

        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/70 shadow-[0_2px_12px_-2px_rgba(15,23,42,0.04)] space-y-1 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block truncate">Showroom</span>
            <p className="font-extrabold text-xl text-slate-900 mt-1">{showrooms.length}</p>
          </div>
          <span className="text-[10px] text-slate-500 font-medium block pt-1">Toàn quốc</span>
        </div>

        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/70 shadow-[0_2px_12px_-2px_rgba(15,23,42,0.04)] space-y-1 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block truncate">Voucher Đặt Cọc</span>
            <p className="font-extrabold text-xl text-slate-900 mt-1">{vouchers.length}</p>
          </div>
          <span className="text-[10px] text-slate-500 font-medium block pt-1">Chiến dịch</span>
        </div>

        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/70 shadow-[0_2px_12px_-2px_rgba(15,23,42,0.04)] space-y-1 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block truncate">Hợp Đồng Cọc</span>
            <p className="font-extrabold text-xl text-slate-900 mt-1">{orders.length}</p>
          </div>
          <span className="text-[10px] text-slate-500 font-medium block pt-1">Đơn hàng</span>
        </div>

        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/70 shadow-[0_2px_12px_-2px_rgba(15,23,42,0.04)] space-y-1 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block truncate">Tài Khoản</span>
            <p className="font-extrabold text-xl text-slate-900 mt-1">{customers.length}</p>
          </div>
          <span className="text-[10px] text-slate-500 font-medium block pt-1">Profiles</span>
        </div>
      </div>

      {/* Connection Health Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Supabase Panel */}
        <Card className="border-slate-200/80">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-sm">Supabase Cloud PostgreSQL</CardTitle>
                <CardDescription>pgvector + Row Level Security (RLS)</CardDescription>
              </div>
            </div>
            <Badge variant={supabaseStatus?.connected ? 'success' : 'danger'} size="sm">
              {supabaseStatus?.connected ? 'ĐÃ KẾT NỐI' : 'LỖI KẾT NỐI'}
            </Badge>
          </CardHeader>
          <CardContent className="p-5 space-y-3 text-xs">
            <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Project Endpoint:</span>
                <span className="text-slate-900 font-semibold truncate max-w-50">
                  vafxrjhzgzihjiphvhms.supabase.co
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Vector Search Engine:</span>
                <span className="text-emerald-600 font-bold">pgvector HNSW (768-dim)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">RLS Policies Status:</span>
                <span className="text-blue-600 font-bold">15 Bảng được bảo vệ qua Policy</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Security Mode:</span>
                <span className="text-indigo-600 font-bold">Authenticated JWT Session</span>
              </div>
            </div>

            <p className="text-slate-600 leading-relaxed text-xs">
              {supabaseStatus?.message || 'Hệ thống đang sẵn sàng xử lý các truy vấn CRUD và Vector Search.'}
            </p>
          </CardContent>
        </Card>

        {/* FastAPI Backend Panel */}
        <Card className="border-slate-200/80">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-sm">FastAPI AI Microservice</CardTitle>
                <CardDescription>Gemini 2.5 Flash + ZaloPay Gateway</CardDescription>
              </div>
            </div>
            <Badge variant={backendStatus?.status === 'online' ? 'success' : 'neutral'} size="sm">
              {backendStatus?.status === 'online' ? 'HOẠT ĐỘNG' : 'SIMULATION MODE'}
            </Badge>
          </CardHeader>
          <CardContent className="p-5 space-y-3 text-xs">
            <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">FastAPI Host:</span>
                <span className="text-slate-900 font-semibold">http://localhost:8000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">LLM Reasoning Engine:</span>
                <span className="text-indigo-600 font-bold">Google Gemini 2.5 Flash</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Embedding Model:</span>
                <span className="text-purple-600 font-bold">gemini-embedding-2</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ZaloPay Gateway:</span>
                <span className="text-emerald-600 font-bold">AppId 2553 Sandbox</span>
              </div>
            </div>

            <p className="text-slate-600 leading-relaxed text-xs">
              {backendStatus?.details || 'Microservice phụ trách trích xuất thực thể, tính Soft Penalty và re-rank.'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Row Level Security & RBAC Inspection Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <CardTitle className="text-sm">Ma Trận Row Level Security (RLS) & Phân Quyền</CardTitle>
          </div>
          <CardDescription>Kiểm tra quyền hạn tài khoản hiện tại đối với các bảng cơ sở dữ liệu</CardDescription>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500">Vai Trò Đang Đăng Nhập:</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className="font-bold text-xs px-2 py-0.5 rounded-md uppercase"
                  style={{ backgroundColor: currentRoleInfo.bg, color: currentRoleInfo.color }}
                >
                  {currentRoleInfo.tag} - {currentRoleInfo.label}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 max-w-md text-right">
              {currentRoleInfo.description}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Kho Xe (cars)</span>
              </div>
              <p className="text-[11px] text-slate-500">
                {isOwner ? 'Toàn quyền CRUD và xóa xe' : 'Xem, thêm và chỉnh sửa thông tin xe'}
              </p>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Hợp Đồng (orders)</span>
              </div>
              <p className="text-[11px] text-slate-500">
                {isOwner ? 'Toàn quyền duyệt, đối soát và xóa' : 'Duyệt trạng thái và xác nhận cọc'}
              </p>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Phân Quyền (profiles)</span>
              </div>
              <p className="text-[11px] text-slate-500">
                {isOwner ? 'Toàn quyền bổ nhiệm & thu hồi quyền Manager' : 'Chỉ xem danh bạ nhân sự'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
