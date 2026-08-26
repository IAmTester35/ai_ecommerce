import React, { useState, useEffect } from 'react';
import {
  Database,
  Server,
  RefreshCw,
  Layers,
  RotateCcw,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { checkSupabaseConnection } from '../lib/supabase';
import { checkBackendHealth } from '../lib/api';
import { useToast } from '../context/ToastContext';

export const SystemSettings: React.FC = () => {
  const { cars, orders, showrooms, vouchers, customers, refreshData } = useData();
  const { success } = useToast();

  const [isCheckingSupabase, setIsCheckingSupabase] = useState(false);
  const [supabaseStatus, setSupabaseStatus] = useState<{ connected: boolean; message: string } | null>(null);

  const [isCheckingBackend, setIsCheckingBackend] = useState(false);
  const [backendStatus, setBackendStatus] = useState<{ status: 'online' | 'offline'; latencyMs?: number; details?: string } | null>(null);

  const testConnections = async () => {
    setIsCheckingSupabase(true);
    const sb = await checkSupabaseConnection();
    setSupabaseStatus(sb);
    setIsCheckingSupabase(false);

    setIsCheckingBackend(true);
    const be = await checkBackendHealth();
    setBackendStatus(be);
    setIsCheckingBackend(false);
  };

  useEffect(() => {
    testConnections();
  }, []);

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Cấu Hình Hệ Thống & Kết Nối Cơ Sở Dữ Liệu
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Giám sát trạng thái kết nối Supabase PostgreSQL, FastAPI AI Vector Search và phân quyền RLS
          </p>
        </div>

        <Button
          variant="outline"
          size="md"
          leftIcon={<RefreshCw className={`w-4 h-4 ${isCheckingSupabase || isCheckingBackend ? 'animate-spin' : ''}`} />}
          onClick={testConnections}
          isLoading={isCheckingSupabase || isCheckingBackend}
        >
          Kiểm Tra Kết Nối
        </Button>
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
            <Badge variant={supabaseStatus?.connected ? 'success' : 'neutral'} size="sm">
              {supabaseStatus?.connected ? 'ĐÃ KẾT NỐI' : 'ACTIVE MOCK'}
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
                <span className="text-slate-500">RLS Policies:</span>
                <span className="text-blue-600 font-bold">15 Bảng được bảo vệ</span>
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
              {backendStatus?.status === 'online' ? `ONLINE (${backendStatus.latencyMs}ms)` : 'SIMULATOR ACTIVE'}
            </Badge>
          </CardHeader>
          <CardContent className="p-5 space-y-3 text-xs">
            <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Local API Base:</span>
                <span className="text-slate-900 font-semibold">http://localhost:8000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">LLM Reasoning Engine:</span>
                <span className="text-indigo-600 font-bold">Google Gemini 2.5 Flash</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Gateway:</span>
                <span className="text-emerald-600 font-bold">ZaloPay V2 API</span>
              </div>
            </div>

            <p className="text-slate-600 leading-relaxed text-xs">
              {backendStatus?.details || 'Đảm nhiệm trích xuất thực thể và xử lý mâu thuẫn yêu cầu xe.'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Database Schema Inventory Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            Thống Kê Khối Lượng Dữ Liệu Thực Tế (Database Schema Entities)
          </CardTitle>
          <CardDescription>Dữ liệu đồng bộ trực tiếp từ master_schema.sql</CardDescription>
        </CardHeader>

        <CardContent className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Bảng cars</span>
              <div className="text-2xl font-extrabold text-slate-900">{cars.length}</div>
              <span className="text-[11px] text-blue-600 font-semibold">Mẫu xe trong kho</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Bảng orders</span>
              <div className="text-2xl font-extrabold text-slate-900">{orders.length}</div>
              <span className="text-[11px] text-emerald-600 font-semibold">Hợp đồng đặt cọc</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Bảng showrooms</span>
              <div className="text-2xl font-extrabold text-slate-900">{showrooms.length}</div>
              <span className="text-[11px] text-indigo-600 font-semibold">Chi nhánh đại lý</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Bảng vouchers</span>
              <div className="text-2xl font-extrabold text-slate-900">{vouchers.length}</div>
              <span className="text-[11px] text-amber-600 font-semibold">Mã ưu đãi cọc</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Bảng profiles</span>
              <div className="text-2xl font-extrabold text-slate-900">{customers.length}</div>
              <span className="text-[11px] text-purple-600 font-semibold">Tài khoản khách</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sync & Refresh Action */}
      <Card>
        <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Đồng Bộ & Tải Lại Dữ Liệu Hệ Thống</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Cập nhật lại toàn bộ danh mục xe, đơn hàng và lịch lái thử mới nhất
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            leftIcon={<RotateCcw className="w-4 h-4" />}
            onClick={async () => {
              await refreshData();
              success('Đã làm mới dữ liệu toàn hệ thống');
            }}
          >
            Làm Mới Toàn Bộ
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
