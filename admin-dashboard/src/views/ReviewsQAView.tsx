import React, { useState } from 'react';
import {
  Star,
  MessageSquare,
  HelpCircle,
  Sparkles,
  Trash2,
  Send,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { triggerReviewEmbedding } from '../lib/api';
import type { Review, CarQA } from '../types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { Textarea } from '../components/ui/Textarea';
import { Tabs } from '../components/ui/Tabs';
import { EmptyState } from '../components/ui/EmptyState';
import { Pagination } from '../components/ui/Pagination';
import { formatDateTime, cn } from '../lib/utils';
import { useToast } from '../context/ToastContext';

export const ReviewsQAView: React.FC = () => {
  const { reviews, carQAs, toggleReviewApproval, deleteReview, answerCarQA, refreshData } = useData();
  const { can } = useAuth();
  const { success, error, info } = useToast();

  const [activeTab, setActiveTab] = useState<'reviews' | 'qa'>('reviews');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Q&A Answer Modal State
  const [selectedQA, setSelectedQA] = useState<CarQA | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [isAnswerModalOpen, setIsAnswerModalOpen] = useState(false);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);

  // Vector Batch Embedding State
  const [isEmbedding, setIsEmbedding] = useState(false);

  const openAnswerModal = (qa: CarQA) => {
    setSelectedQA(qa);
    setAnswerText(qa.answer || '');
    setIsAnswerModalOpen(true);
  };

  const handleSendAnswer = async () => {
    if (!selectedQA || !answerText.trim()) return;
    setIsSubmittingAnswer(true);
    await answerCarQA(selectedQA.id, answerText.trim());
    setIsSubmittingAnswer(false);
    setIsAnswerModalOpen(false);
  };

  const handleToggleApproval = async (review: Review) => {
    const nextStatus = review.is_approved === false ? true : false;
    await toggleReviewApproval(review.id, nextStatus);
  };

  const handleDeleteReview = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bài đánh giá này?')) {
      await deleteReview(id);
    }
  };

  // Run FastAPI Gemini Batch Vectorization for Reviews
  const handleTriggerEmbedding = async () => {
    setIsEmbedding(true);
    try {
      const res = await triggerReviewEmbedding();
      if (res.processed_count > 0) {
        success(
          'Vector hóa thành công!',
          `Đã tạo 768-dim embeddings cho ${res.processed_count} bài đánh giá bằng Google Gemini.`
        );
        await refreshData();
      } else {
        info('Chỉ mục Vector đã cập nhật', 'Tất cả bài đánh giá hiện tại đều đã có 768-dim Vector.');
      }
    } catch (err) {
      error('Lỗi tạo Vector', err instanceof Error ? err.message : 'Không thể kết nối Backend FastAPI.');
    } finally {
      setIsEmbedding(false);
    }
  };

  const totalReviewPages = Math.ceil(reviews.length / pageSize) || 1;
  const paginatedReviews = reviews.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const totalQAPages = Math.ceil(carQAs.length / pageSize) || 1;
  const paginatedQAs = carQAs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const pendingReviewsCount = reviews.filter((r) => r.is_approved === false).length;
  const unvectorizedCount = reviews.filter((r) => r.embedding === null || r.embedding === undefined).length;

  return (
    <div className="space-y-8 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-1">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Đánh Giá & Hỏi Đáp</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal">
            Kiểm duyệt {reviews.length.toLocaleString('vi-VN')} đánh giá xe và giải đáp tư vấn khách hàng
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'reviews' && (
            <Button
              variant="outline"
              size="md"
              leftIcon={<Sparkles className={cn('w-4 h-4 text-indigo-600', isEmbedding && 'animate-spin')} />}
              isLoading={isEmbedding}
              onClick={handleTriggerEmbedding}
            >
              Vector Hóa Đánh Giá ({unvectorizedCount} chờ)
            </Button>
          )}

          <Tabs
            tabs={[
              {
                id: 'reviews',
                label: pendingReviewsCount > 0 ? `Đánh Giá (${pendingReviewsCount} chờ)` : 'Đánh Giá Xe (Reviews)',
                count: reviews.length,
                icon: <MessageSquare className="w-3.5 h-3.5" />,
              },
              {
                id: 'qa',
                label: 'Hỏi & Đáp (Car Q&A)',
                count: carQAs.length,
                icon: <HelpCircle className="w-3.5 h-3.5" />,
              },
            ]}
            activeTab={activeTab}
            onChange={(tab) => {
              setActiveTab(tab as 'reviews' | 'qa');
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* Tab 1: Reviews */}
      {activeTab === 'reviews' && (
        <Card className="overflow-hidden">
          {reviews.length === 0 ? (
            <EmptyState
              icon={<MessageSquare className="w-8 h-8" />}
              title="Chưa có đánh giá nào"
              description="Các đánh giá thực tế của khách hàng về trải nghiệm lái xe sẽ hiển thị ở đây."
            />
          ) : (
            <>
              <Table bare>
                <TableHeader>
                  <TableRow>
                    <TableHead>Khách Hàng</TableHead>
                    <TableHead>Mẫu Xe</TableHead>
                    <TableHead>Điểm Đánh Giá</TableHead>
                    <TableHead>Nội Dung Trải Nghiệm (RAG Context)</TableHead>
                    <TableHead>Chỉ Mục Vector (HNSW)</TableHead>
                    <TableHead>Kiểm Duyệt</TableHead>
                    <TableHead>Thời Gian</TableHead>
                    <TableHead className="text-right">Hành Động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedReviews.map((rev) => {
                    const hasVector = rev.embedding !== null && rev.embedding !== undefined;
                    const isApproved = rev.is_approved !== false;

                    return (
                      <TableRow key={rev.id} className="hover:bg-slate-50/80 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <img
                              src={
                                rev.profile?.avatar_url ||
                                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'
                              }
                              alt=""
                              className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0"
                            />
                            <div>
                              <div className="font-bold text-slate-900 text-xs">
                                {rev.profile?.full_name || 'Khách hàng'}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                {rev.source === 'golden_dataset' ? 'Golden Dataset' : rev.profile?.email || 'Nguồn User'}
                              </div>
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

                        <TableCell className="max-w-md">
                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                            "{rev.comment}"
                          </p>
                        </TableCell>

                        {/* Real Vector Status Check */}
                        <TableCell>
                          {hasVector ? (
                            <Badge variant="primary" size="sm" className="bg-indigo-50 text-indigo-700 font-mono">
                              <Sparkles className="w-3 h-3 mr-1" />
                              768-dim
                            </Badge>
                          ) : (
                            <Badge variant="neutral" size="sm" className="text-slate-400">
                              Chưa tạo
                            </Badge>
                          )}
                        </TableCell>

                        {/* Moderation Status */}
                        <TableCell>
                          <Badge variant={isApproved ? 'success' : 'warning'} size="sm">
                            {isApproved ? 'Đã duyệt' : 'Chờ duyệt'}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <span className="text-[11px] text-slate-400">
                            {formatDateTime(rev.created_at)}
                          </span>
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Moderation Approval Toggle */}
                            <button
                              type="button"
                              onClick={() => handleToggleApproval(rev)}
                              className={cn(
                                'p-1.5 rounded-lg transition-colors cursor-pointer',
                                isApproved
                                  ? 'text-emerald-600 hover:bg-emerald-50'
                                  : 'text-amber-600 hover:bg-amber-50'
                              )}
                              title={isApproved ? 'Bỏ duyệt hiển thị' : 'Duyệt bài đánh giá'}
                            >
                              {isApproved ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                            </button>

                            {can('REVIEWS_DELETE') && (
                              <button
                                onClick={() => handleDeleteReview(rev.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Xóa đánh giá"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <Pagination
                currentPage={currentPage}
                totalPages={totalReviewPages}
                onPageChange={setCurrentPage}
                totalItems={reviews.length}
                pageSize={pageSize}
              />
            </>
          )}
        </Card>
      )}

      {/* Tab 2: Q&A */}
      {activeTab === 'qa' && (
        <Card className="overflow-hidden">
          {carQAs.length === 0 ? (
            <EmptyState
              icon={<HelpCircle className="w-8 h-8" />}
              title="Chưa có câu hỏi nào từ khách hàng"
              description="Các câu hỏi về thông số xe hoặc tư vấn đặt cọc sẽ hiển thị ở đây."
            />
          ) : (
            <>
              <Table bare>
                <TableHeader>
                  <TableRow>
                    <TableHead>Khách Hàng Hỏi</TableHead>
                    <TableHead>Mẫu Xe Quan Tâm</TableHead>
                    <TableHead>Nội Dung Câu Hỏi</TableHead>
                    <TableHead>Phản Hồi Từ Cố Vấn</TableHead>
                    <TableHead>Thời Gian</TableHead>
                    <TableHead className="text-right">Hành Động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedQAs.map((qa) => (
                    <TableRow key={qa.id}>
                      <TableCell>
                        <div className="font-bold text-slate-900 text-xs">
                          {qa.profile?.full_name || 'Khách hàng quan tâm'}
                        </div>
                        <div className="text-[11px] text-slate-400">{qa.profile?.email}</div>
                      </TableCell>

                      <TableCell>
                        <span className="font-bold text-slate-800 text-xs">
                          {qa.car ? `${qa.car.make} ${qa.car.model}` : 'Xe thương mại'}
                        </span>
                      </TableCell>

                      <TableCell className="max-w-xs">
                        <p className="text-xs text-slate-800 font-medium">{qa.question}</p>
                      </TableCell>

                      <TableCell className="max-w-xs">
                        {qa.answer ? (
                          <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <p className="line-clamp-2">{qa.answer}</p>
                            {qa.answerer && (
                              <span className="text-[10px] text-blue-600 font-semibold mt-1 block">
                                Cố vấn: {qa.answerer.full_name || qa.answerer.email}
                              </span>
                            )}
                          </div>
                        ) : (
                          <Badge variant="warning" size="sm">
                            Chưa phản hồi
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell>
                        <span className="text-[11px] text-slate-400">{formatDateTime(qa.created_at)}</span>
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          variant={qa.answer ? 'outline' : 'primary'}
                          size="sm"
                          leftIcon={qa.answer ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                          onClick={() => openAnswerModal(qa)}
                        >
                          {qa.answer ? 'Sửa' : 'Trả lời'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Pagination
                currentPage={currentPage}
                totalPages={totalQAPages}
                onPageChange={setCurrentPage}
                totalItems={carQAs.length}
                pageSize={pageSize}
              />
            </>
          )}
        </Card>
      )}

      {/* Modal: Answer Car Q&A */}
      <Modal
        isOpen={isAnswerModalOpen}
        onClose={() => setIsAnswerModalOpen(false)}
        title="Tư Vấn & Trả Lời Câu Hỏi Khách Hàng"
        description={
          selectedQA
            ? `Khách hàng: ${selectedQA.profile?.full_name || 'Khách hàng'} • Mẫu xe: ${
                selectedQA.car ? `${selectedQA.car.make} ${selectedQA.car.model}` : ''
              }`
            : undefined
        }
        maxWidth="md"
      >
        <div className="space-y-4 text-left">
          {selectedQA && (
            <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">
                Câu Hỏi Của Khách Hàng:
              </span>
              <p className="text-xs font-semibold text-slate-800">{selectedQA.question}</p>
            </div>
          )}

          <Textarea
            label="Nội Dung Phản Hồi Tư Vấn *"
            rows={4}
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            placeholder="Kính chào Quý khách, phiên bản này được trang bị hệ thống lái 4 bánh và gói hỗ trợ đỗ xe tự động..."
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsAnswerModalOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="primary"
              leftIcon={<Send className="w-4 h-4" />}
              isLoading={isSubmittingAnswer}
              onClick={handleSendAnswer}
            >
              Gửi Phản Hồi Cho Khách
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
