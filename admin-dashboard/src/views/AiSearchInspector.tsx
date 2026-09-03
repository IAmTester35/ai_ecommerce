import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  AlertTriangle,
  CheckCircle2,
  Play,
  Terminal,
  Activity,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { searchWithAI } from '../lib/api';
import type { AISearchResponse } from '../types';
import { formatVND, formatDateTime, cn } from '../lib/utils';

export const AiSearchInspector: React.FC = () => {
  const { searchHistory } = useData();

  const [query, setQuery] = useState('Tìm xe thể thao coupe V12 giá dưới 1 tỷ để đi dạo phố');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<AISearchResponse | null>(null);

  // Live SSE Stream progress & text
  const [progressSteps, setProgressSteps] = useState<{ step: string; message: string }[]>([]);
  const [streamingText, setStreamingText] = useState('');

  const sampleQueries = [
    {
      label: 'Mâu thuẫn: V12 giá < 1 Tỷ',
      text: 'Tìm xe thể thao động cơ V12, thiết kế sang trọng giá dưới 1 tỷ',
      isConflict: true,
    },
    {
      label: 'Xe điện siêu tốc: 0-100 < 3s',
      text: 'Tôi cần một chiếc sedan thuần điện tăng tốc dưới 3 giây sạc nhanh 800V',
      isConflict: false,
    },
    {
      label: 'Porsche 911 cao cấp',
      text: 'Gợi ý cho tôi dòng Porsche 911 màu trắng có gói Sport Chrono',
      isConflict: false,
    },
    {
      label: 'SUV Gia đình 7 chỗ',
      text: 'Xe SUV gia đình 6-7 chỗ hàng ghế thương gia êm ái cách âm tốt tầm giá 2 tỷ',
      isConflict: false,
    },
  ];

  const handleRunSearch = async (textToSearch?: string) => {
    const q = textToSearch || query;
    if (!q.trim()) return;

    setIsLoading(true);
    setProgressSteps([]);
    setStreamingText('');
    setSearchResult(null);

    try {
      const res = await searchWithAI(q, {
        onProgress: (step, message) => {
          setProgressSteps((prev) => [...prev, { step, message }]);
        },
        onChunk: (token) => {
          setStreamingText((prev) => prev + token);
        },
      });
      setSearchResult(res);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              AI Vector & Conflict Resolution Hub
            </h2>
            <Badge variant="secondary" size="md">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Gemini 2.5 + HNSW RAG
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Môi trường kiểm thử & trực quan hóa 5 tầng kiến trúc suy luận, bóc tách thực thể và xử lý mâu thuẫn yêu cầu
          </p>
        </div>
      </div>

      {/* Query Input Box with Quick Sample Chips */}
      <Card className="border-indigo-100 shadow-sm">
        <CardContent className="p-5 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
              Nhập Câu Hỏi Khách Hàng (Natural Language Query)
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <div className="relative flex-1 w-full">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRunSearch()}
                  placeholder="Nhập yêu cầu xe bằng ngôn ngữ tự nhiên..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-4 pr-10 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition-all shadow-2xs"
                />
              </div>

              <Button
                variant="secondary"
                size="md"
                leftIcon={<Play className="w-4 h-4 fill-current" />}
                onClick={() => handleRunSearch()}
                isLoading={isLoading}
                className="w-full sm:w-auto"
              >
                Chạy Suy Luận AI
              </Button>
            </div>
          </div>

          {/* Quick Prompts */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Mẫu Thử Nghiệm Kiểm Chứng Nhanh:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {sampleQueries.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(s.text);
                    handleRunSearch(s.text);
                  }}
                  className={cn(
                    'text-xs px-3 py-1.5 rounded-xl border transition-all cursor-pointer font-medium flex items-center gap-1.5',
                    s.isConflict
                      ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                      : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                  )}
                >
                  {s.isConflict ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  )}
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live SSE Stream Progress Box */}
      {(isLoading || progressSteps.length > 0) && (
        <Card className="border-indigo-200 bg-slate-900 text-slate-100 font-mono text-xs overflow-hidden">
          <div className="p-3 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-slate-200">
                Tiến Trình SSE Streaming (FastAPI /api/search)
              </span>
            </div>
            {isLoading && (
              <Badge variant="primary" size="sm" className="bg-indigo-900 text-indigo-200 animate-pulse font-mono">
                <Activity className="w-3 h-3 mr-1 animate-spin" />
                Live Stream
              </Badge>
            )}
          </div>
          <div className="p-4 space-y-2 max-h-56 overflow-y-auto">
            {progressSteps.map((p, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-blue-400 font-bold shrink-0">[{p.step}]</span>
                <span className="text-slate-300">{p.message}</span>
              </div>
            ))}
            {streamingText && (
              <div className="pt-2 border-t border-slate-800 text-emerald-400 whitespace-pre-wrap leading-relaxed">
                {streamingText}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* 5-Layer Inspection Pipeline Visualization */}
      {searchResult && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Layer 1 & 2: Entity Extraction & Conflict Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Layer 1: Extraction */}
            <Card className="border-slate-200/80">
              <CardHeader className="bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <CardTitle className="text-sm">Trích Xuất Thực Thể (Entity Extraction)</CardTitle>
                </div>
                <Badge variant="primary" size="sm">
                  Gemini Structured Output
                </Badge>
              </CardHeader>
              <CardContent className="p-4 space-y-3 font-mono text-xs">
                <div className="p-3 bg-slate-900 text-slate-100 rounded-xl space-y-1 overflow-x-auto">
                  <p className="text-blue-400 font-bold">// Hard Constraints:</p>
                  <p>max_price: {searchResult.constraints.max_price ? formatVND(searchResult.constraints.max_price) : 'null'}</p>
                  <p>min_hp: {searchResult.constraints.min_hp || 'null'}</p>
                  <p>make: {searchResult.constraints.make || 'null'}</p>
                  <p>fuel_type: {searchResult.constraints.fuel_type || 'null'}</p>
                  <p className="text-indigo-400 font-bold mt-2">// Soft Intent:</p>
                  <p className="text-emerald-400">"{searchResult.constraints.soft_intent || searchResult.original_query}"</p>
                </div>
              </CardContent>
            </Card>

            {/* Layer 2: Conflict Awareness */}
            <Card className={searchResult.conflict_detected ? 'border-amber-300 bg-amber-50/30' : 'border-emerald-200 bg-emerald-50/30'}>
              <CardHeader className="bg-white/80">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'w-6 h-6 rounded-lg text-white flex items-center justify-center font-bold text-xs',
                      searchResult.conflict_detected ? 'bg-amber-500' : 'bg-emerald-600'
                    )}
                  >
                    2
                  </div>
                  <CardTitle className="text-sm">Cơ Chế Xử Lý Mâu Thuẫn (Conflict-Aware)</CardTitle>
                </div>
                <Badge variant={searchResult.conflict_detected ? 'warning' : 'success'} size="sm">
                  {searchResult.conflict_detected ? 'PHÁT HIỆN MÂU THUẪN' : 'HỢP LỆ (NO CONFLICT)'}
                </Badge>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs">
                {searchResult.conflict_detected ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-amber-900 font-bold">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      Yêu cầu không khả thi trong cơ sở dữ liệu thực tế
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      Hệ thống tự động kích hoạt chiến lược <strong>Nới lỏng ràng buộc (Constraint Relaxation)</strong> và thuật toán <strong>Soft Penalty Scoring</strong> để gợi ý các mẫu xe thay thế phù hợp nhất thay vì trả về kết quả rỗng.
                    </p>
                    {searchResult.relaxed_terms?.length > 0 && (
                      <div className="p-2.5 bg-amber-100/60 rounded-lg text-amber-950 font-mono text-[11px]">
                        {searchResult.relaxed_terms.join(', ')}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-emerald-900 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Không phát hiện mâu thuẫn vật lý hoặc giá cả
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      Các tiêu chí truy vấn hoàn toàn khả thi và khớp chính xác với dải sản phẩm thực tế trong kho xe.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Layer 3: Ranked Cars */}
          <Card>
            <CardHeader className="bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                    3
                  </div>
                  <CardTitle className="text-sm">
                    Mẫu Xe Đề Xuất (Hybrid Reranked - {searchResult.results.length} xe)
                  </CardTitle>
                </div>
                <Badge variant="primary" size="sm">
                  Vector HNSW Similarity + Metadata Filter
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResult.results.map((car, idx) => (
                  <div
                    key={car.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                          Hạng #{idx + 1}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm mt-1">
                          {car.make} {car.model}
                        </h4>
                        <span className="text-xs text-slate-500">Năm {car.year}</span>
                      </div>
                      <Badge variant="success" size="sm" className="font-mono">
                        Tương đồng {(car.similarity * 100).toFixed(0)}%
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                      <span className="font-extrabold text-blue-600">{formatVND(car.price)}</span>
                    </div>

                    {car.review && (
                      <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg italic line-clamp-3">
                        "{car.review}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search History from Real Database */}
      <Card>
        <CardHeader className="bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-500" />
              <CardTitle className="text-sm">Lịch Sử Tìm Kiếm Thực Tế (search_history Supabase Table)</CardTitle>
            </div>
            <Badge variant="neutral" size="sm">
              {searchHistory.length} lượt tìm
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {searchHistory.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400">Chưa có lịch sử tìm kiếm nào được lưu</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {searchHistory.slice(0, 8).map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-800">"{item.query_text}"</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {formatDateTime(item.created_at)}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setQuery(item.query_text);
                      handleRunSearch(item.query_text);
                    }}
                  >
                    Kiểm Tra Lại
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
