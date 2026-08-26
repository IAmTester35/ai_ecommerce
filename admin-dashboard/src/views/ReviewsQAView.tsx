import React, { useState } from 'react';
import {
  MessageSquare,
  Star,
  Trash2,
  Reply,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import type { CarQA } from '../types';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Tabs } from '../components/ui/Tabs';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { Pagination } from '../components/ui/Pagination';
import { formatDateTime } from '../lib/utils';

export const ReviewsQAView: React.FC = () => {
  const { reviews, carQAs, deleteReview, answerCarQA } = useData();
  const { can } = useAuth();

  const [activeTab, setActiveTab] = useState<'reviews' | 'qa'>('reviews');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

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

  const handleDeleteReview = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bài đánh giá này?')) {
      await deleteReview(id);
    }
  };

  const totalReviewPages = Math.ceil(reviews.length / pageSize);
  const paginatedReviews = reviews.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const totalQAPages = Math.ceil(carQAs.length / pageSize);
  const paginatedQAs = carQAs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Đánh Giá Xe & Hỏi Đáp Khách Hàng</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kiểm duyệt {reviews.length.toLocaleString('vi-VN')} bài đánh giá (Vector Index HNSW cho RAG) và phản hồi tư vấn trực tiếp cho người mua
          </p>
        </div>

        <Tabs
          tabs={[
            {
              id: 'reviews',
              label: 'Đánh Giá Xe (Reviews)',
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
                  {paginatedReviews.map((rev) => (
                    <TableRow key={rev.id}>
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

                      <TableCell>
                        <Badge variant="primary" size="sm" className="bg-indigo-50 text-indigo-700 font-mono">
                          <Sparkles className="w-3 h-3 mr-1" />
                          768-dim
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <span className="text-[11px] text-slate-400">
                          {formatDateTime(rev.created_at)}
                        </span>
                      </TableCell>

                      <TableCell className="text-right">
                        {can('REVIEWS_DELETE') && (
                          <button
                            onClick={() => handleDeleteReview(rev.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Xóa đánh giá"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Khách Hàng Hỏi</TableHead>
                    <TableHead>Mẫu Xe Quan Tâm</TableHead>
                    <TableHead>Nội Dung Câu Hỏi</TableHead>
                    <TableHead>Phản Hồi Từ Cố Vấn</TableHead>
                    <TableHead>Trạng Thái</TableHead>
                    <TableHead className="text-right">Hành Động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedQAs.map((qa) => (
                    <TableRow key={qa.id}>
                      <TableCell>
                        <div className="font-bold text-slate-900 text-xs">
                          {qa.profile?.full_name || 'Khách hàng'}
                        </div>
                        <div className="text-[10px] text-slate-400">{qa.profile?.email}</div>
                      </TableCell>

                      <TableCell>
                        <span className="font-semibold text-slate-800 text-xs">
                          {qa.car ? `${qa.car.make} ${qa.car.model}` : 'Xe thương mại'}
                        </span>
                      </TableCell>

                      <TableCell className="max-w-xs">
                        <p className="text-xs text-slate-800 font-medium line-clamp-2">
                          {qa.question}
                        </p>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">
                          {formatDateTime(qa.created_at)}
                        </span>
                      </TableCell>

                      <TableCell className="max-w-xs">
                        {qa.answer ? (
                          <div className="space-y-0.5">
                            <p className="text-xs text-emerald-800 line-clamp-2 bg-emerald-50/70 p-2 rounded-lg border border-emerald-100 font-medium">
                              {qa.answer}
                            </p>
                            <span className="text-[10px] text-slate-400 block">
                              Bởi: {qa.answerer?.full_name || 'Cố Vấn AutoMatch'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Chưa phản hồi</span>
                        )}
                      </TableCell>

                      <TableCell>
                        <Badge variant={qa.answer ? 'success' : 'warning'} size="sm">
                          {qa.answer ? 'Đã trả lời' : 'Chờ phản hồi'}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          variant={qa.answer ? 'outline' : 'primary'}
                          size="sm"
                          leftIcon={<Reply className="w-3.5 h-3.5" />}
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

      {/* Answer Modal */}
      {selectedQA && (
        <Modal
          isOpen={isAnswerModalOpen}
          onClose={() => setIsAnswerModalOpen(false)}
          title={`Phản Hồi Câu Hỏi Khách Hàng`}
          description={`Câu hỏi về mẫu xe: ${selectedQA.car ? `${selectedQA.car.make} ${selectedQA.car.model}` : 'Ô tô'}`}
          maxWidth="lg"
        >
          <form onSubmit={handleSaveAnswer} className="space-y-4 text-left">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block">
                Nội Dung Khách Hàng Hỏi:
              </span>
              <p className="font-semibold text-slate-900 leading-relaxed">"{selectedQA.question}"</p>
            </div>

            <Textarea
              label="Nội Dung Tư Vấn / Giải Đáp *"
              rows={4}
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Nhập nội dung tư vấn kỹ thuật chi tiết..."
              required
            />

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button variant="outline" type="button" onClick={() => setIsAnswerModalOpen(false)}>
                Hủy
              </Button>
              <Button variant="primary" type="submit">
                Gửi Phản Hồi
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
