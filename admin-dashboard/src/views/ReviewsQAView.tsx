import React, { useState } from 'react';
import {
  MessageSquare,
  Star,
  Trash2,
  Reply,
  HelpCircle,
  Sparkles,
  Car as CarIcon,
  User,
  ShieldCheck,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import type { CarQA } from '../types';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Tabs } from '../components/ui/Tabs';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { formatDateTime } from '../lib/utils';

export const ReviewsQAView: React.FC = () => {
  const { reviews, carQAs, deleteReview, answerCarQA } = useData();

  const [activeTab, setActiveTab] = useState<'reviews' | 'qa'>('reviews');

  // QA Answer Modal State
  const [selectedQA, setSelectedQA] = useState<CarQA | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [isAnswerModalOpen, setIsAnswerModalOpen] = useState(false);

  const openAnswerModal = (qa: CarQA) => {
    setSelectedQA(qa);
    setAnswerText(qa.answer || '');
    setIsAnswerModalOpen(true);
  };

  const handleSaveAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQA) return;
    await answerCarQA(selectedQA.id, answerText);
    setIsAnswerModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Đánh Giá Xe & Hỏi Đáp Khách Hàng</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kiểm duyệt bài đánh giá (Vector Index HNSW cho RAG) và phản hồi tư vấn kỹ thuật trực tiếp cho người mua
          </p>
        </div>

        <Tabs
          tabs={[
            { id: 'reviews', label: 'Đánh Giá Xe (Reviews)', count: reviews.length, icon: <MessageSquare className="w-3.5 h-3.5" /> },
            { id: 'qa', label: 'Hỏi & Đáp (Car Q&A)', count: carQAs.length, icon: <HelpCircle className="w-3.5 h-3.5" /> },
          ]}
          activeTab={activeTab}
          onChange={(tab) => setActiveTab(tab as any)}
        />
      </div>

      {/* Tab 1: Reviews */}
      {activeTab === 'reviews' && (
        <Card className="overflow-hidden">
          {reviews.length === 0 ? (
            <EmptyState
              icon={<MessageSquare className="w-8 h-8" />}
              title="Chưa có đánh giá nào"
              description="Các đánh giá của khách hàng về trải nghiệm lái xe sẽ hiển thị ở đây."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Khách Hàng</TableHead>
                  <TableHead>Mẫu Xe</TableHead>
                  <TableHead>Điểm Đánh Giá</TableHead>
                  <TableHead>Nội Dung Trải Nghiệm (RAG Context)</TableHead>
                  <TableHead>Chỉ Mục Vector (HNSW)</TableHead>
                  <TableHead>Thời Gian</TableHead>
                  <TableHead className="text-right">Hành Động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((rev) => (
                  <TableRow key={rev.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <img
                          src={rev.profile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                          alt=""
                          className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0"
                        />
                        <div>
                          <div className="font-bold text-slate-900 text-xs">
                            {rev.profile?.full_name || 'Khách hàng'}
                          </div>
                          <div className="text-[10px] text-slate-400">{rev.profile?.email}</div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="font-bold text-slate-800 text-xs">
                        {rev.car ? `${rev.car.make} ${rev.car.model}` : 'Xe thương mại'}
                      </span>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1 font-extrabold text-amber-600 text-xs">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span>{rev.rating || 5.0} / 5</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <p className="text-xs text-slate-700 leading-relaxed max-w-md line-clamp-2">
                        "{rev.comment}"
                      </p>
                    </TableCell>

                    <TableCell>
                      <Badge variant="secondary" size="sm">
                        <Sparkles className="w-3 h-3 mr-1" />
                        768-dim Vector
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <span className="text-[11px] text-slate-500">{formatDateTime(rev.created_at)}</span>
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (window.confirm('Xác nhận xóa đánh giá này?')) {
                            deleteReview(rev.id);
                          }
                        }}
                        title="Xóa đánh giá"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      )}

      {/* Tab 2: Car Q&A */}
      {activeTab === 'qa' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {carQAs.map((qa) => {
            const isAnswered = !!qa.answer;
            return (
              <Card key={qa.id} className="p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <CarIcon className="w-4 h-4 text-blue-600" />
                      <span className="font-bold text-slate-900 text-sm">
                        {qa.car ? `${qa.car.make} ${qa.car.model}` : 'Xe hỏi đáp'}
                      </span>
                    </div>
                    <Badge variant={isAnswered ? 'success' : 'warning'} size="sm">
                      {isAnswered ? 'Đã trả lời' : 'Chờ phản hồi'}
                    </Badge>
                  </div>

                  {/* Question */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 text-left">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <User className="w-3 h-3 text-slate-400" />
                      <span className="font-semibold text-slate-700">
                        {qa.profile?.full_name || 'Khách hàng quan tâm'}
                      </span>
                      <span>• {formatDateTime(qa.created_at)}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 leading-snug">
                      "{qa.question}"
                    </p>
                  </div>

                  {/* Answer */}
                  {isAnswered ? (
                    <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100 space-y-1.5 text-left">
                      <div className="flex items-center gap-1.5 text-[11px] text-blue-700">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                        <span className="font-bold">
                          {qa.answerer?.full_name || 'Chuyên viên AutoMatch'}
                        </span>
                        <span className="text-blue-500">• {formatDateTime(qa.updated_at)}</span>
                      </div>
                      <p className="text-xs text-slate-800 leading-relaxed">{qa.answer}</p>
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 italic">
                      Câu hỏi đang chờ chuyên viên trả lời để hiển thị cho khách hàng trên ứng dụng.
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end pt-2 border-t border-slate-100">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Reply className="w-3.5 h-3.5" />}
                    onClick={() => openAnswerModal(qa)}
                  >
                    {isAnswered ? 'Cập Nhật Câu Trả Lời' : 'Trả Lời Ngay'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Answer Modal */}
      {selectedQA && (
        <Modal
          isOpen={isAnswerModalOpen}
          onClose={() => setIsAnswerModalOpen(false)}
          title={`Phản Hồi Câu Hỏi Về: ${selectedQA.car?.make} ${selectedQA.car?.model}`}
          description={`Người hỏi: ${selectedQA.profile?.full_name || 'Khách hàng'}`}
          maxWidth="md"
        >
          <form onSubmit={handleSaveAnswer} className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1 text-left">
              <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">
                Câu hỏi của khách:
              </span>
              <p className="font-bold text-slate-900">"{selectedQA.question}"</p>
            </div>

            <Textarea
              label="Nội Dung Câu Trả Lời Của Chuyên Viên *"
              rows={4}
              placeholder="Nhập câu trả lời chính xác, nhiệt tình để tư vấn cho khách..."
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              required
            />

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button variant="outline" type="button" onClick={() => setIsAnswerModalOpen(false)}>
                Hủy
              </Button>
              <Button variant="primary" type="submit">
                Xuất Bản Câu Trả Lời
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
