import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  AlertTriangle,
  CheckCircle2,
  Play,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { searchWithAI } from '../lib/api';
import type { AISearchResponse } from '../types';
import { formatVND, formatDateTime } from '../lib/utils';

export const AiSearchInspector: React.FC = () => {
  const { searchHistory } = useData();

  const [query, setQuery] = useState('Tìm xe thể thao coupe V12 giá dưới 1 tỷ để đi dạo phố');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<AISearchResponse | null>(null);

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
    const res = await searchWithAI(q);
    setSearchResult(res);
    setIsLoading(false);
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
                  className={`text-xs px-3 py-1.5 rounded-xl border transition-all cursor-pointer font-medium flex items-center gap-1.5 ${s.isConflict
                    ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                    : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                    }`}
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
                    className={`w-6 h-6 rounded-lg text-white flex items-center justify-center font-bold text-xs ${searchResult.conflict_detected ? 'bg-amber-500' : 'bg-emerald-600'
                      }`}
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
                      Yêu cầu logic hợp lệ hoàn toàn
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      Thông số kỹ thuật và tầm ngân sách khớp với các dòng xe hiện có trong kho hàng.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Layer 3 & 4: Vector Retrieval Results & Re-ranking */}
          <Card>
            <CardHeader className="bg-slate-50/60">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                  3 & 4
                </div>
                <div>
                  <CardTitle className="text-sm">Kết Quả Truy Xuất Vector (Hybrid Vector Retrieval & Re-ranking)</CardTitle>
                  <CardDescription>RPC match_cars() trên bảng reviews kèm độ tương đồng Cosine</CardDescription>
                </div>
              </div>
              <Badge variant="secondary" size="sm">
                Top {searchResult.results.length} Candidates
              </Badge>
            </CardHeader>

            <CardContent className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {searchResult.results.map((car, idx) => (
                  <div
                    key={car.id}
                    className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 font-extrabold text-xs flex items-center justify-center border border-indigo-100">
                        #{idx + 1}
                      </span>
                      <div className="flex items-center gap-1 font-mono text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        <span>Sim:</span>
                        <span>{(car.similarity * 100).toFixed(1)}%</span>
                      </div>
                    </div>

                    {car.image_url && (
                      <img
                        src={car.image_url}
                        alt=""
                        className="w-full h-32 rounded-xl object-cover border border-slate-100"
                      />
                    )}

                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        {car.make} {car.model}
                      </h4>
                      <p className="text-xs font-extrabold text-blue-600 mt-0.5">
                        {formatVND(car.price)}
                      </p>
                    </div>

                    <p className="text-xs text-slate-500 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100 line-clamp-3">
                      "{car.review}"
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Layer 5: Generative Synthesis Output */}
          <Card className="border-indigo-200 bg-linear-to-r from-blue-50/60 via-indigo-50/40 to-white">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-indigo-700 text-white flex items-center justify-center font-bold text-xs">
                  5
                </div>
                <CardTitle className="text-sm text-indigo-950">Phản Hồi Trợ Lý AI Sinh Ra (Generative Response)</CardTitle>
              </div>
              <Badge variant="secondary" size="sm">
                LLM Synthesis
              </Badge>
            </CardHeader>
            <CardContent className="p-5">
              <div className="p-4 bg-white rounded-xl border border-indigo-100 shadow-xs text-sm text-slate-800 leading-relaxed font-medium">
                {searchResult.ai_message}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search History Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-600" />
            Lịch Sử Tìm Kiếm Thực Tế Từ Khách Hàng (search_history)
          </CardTitle>
          <CardDescription>Các câu truy vấn tự nhiên đã ghi nhận trên hệ thống</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {searchHistory.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setQuery(item.query_text);
                  handleRunSearch(item.query_text);
                }}
                className="p-3.5 px-5 hover:bg-slate-50 flex items-center justify-between transition-colors cursor-pointer text-xs"
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span className="font-semibold text-slate-800">{item.query_text}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                  <span>{item.profile?.full_name || 'Khách hàng'}</span>
                  <span>•</span>
                  <span>{formatDateTime(item.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
