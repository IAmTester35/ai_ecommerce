import React, { useState } from 'react';
import {
  Send,
  Clock,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { sendBroadcastNotification } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { formatDateTime } from '../lib/utils';

export const NotificationsView: React.FC = () => {
  const { notifications, customers, createNotification } = useData();
  const { success } = useToast();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetType, setTargetType] = useState<'broadcast' | 'user'>('broadcast');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [notifType, setNotifType] = useState('promotion');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSending(true);
    const userId = targetType === 'user' ? selectedUserId : null;

    // Call FastAPI push notification endpoint
    await sendBroadcastNotification(title, content);

    // Save to Supabase & Context state
    await createNotification(title, content, userId, notifType);

    setIsSending(false);
    success('Đã phát thông báo thành công!', 'Thông báo đã được gửi đến thiết bị người dùng.');
    setTitle('');
    setContent('');
  };

  const templates = [
    {
      title: 'Đặc Quyền Đặt Cọc Xe Sang Mùa Thu',
      content: 'Giảm ngay 100.000.000 VNĐ vào tiền đặt cọc giữ xe Porsche và Mercedes-Benz khi áp dụng mã VIPCAR100M.',
      type: 'promotion',
    },
    {
      title: 'Hệ Thống Trợ Lý AI Nâng Cấp Model 2.5',
      content: 'Tìm kiếm xe thông minh giờ đây hiểu sâu hơn về cảm giác lái và hỗ trợ gợi ý xe thay thế khi mâu thuẫn ngân sách.',
      type: 'system',
    },
    {
      title: 'Nhắc Nhở Lịch Hẹn Lái Thử Tại Showroom',
      content: 'Chuyên viên AutoMatch đã chuẩn bị sẵn xe và cung đường trải nghiệm cho bạn. Vui lòng đến đúng giờ.',
      type: 'test_drive',
    },
  ];

  return (
    <div className="space-y-6 text-left">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Trung Tâm Thông Báo & Push Broadcast</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Soạn thảo và phát đi thông báo đẩy tới toàn bộ khách hàng trên ứng dụng di động hoặc gửi cho cá nhân
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notification Composer (2 cols) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle className="text-sm flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-600" />
                Soạn Thông Báo Mới
              </CardTitle>
              <CardDescription>Gửi thông báo Push qua Backend FastAPI và lưu bảng notifications</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={handleSend} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Đối Tượng Nhận Thông Báo *"
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value as any)}
                >
                  <option value="broadcast">Phát toàn hệ thống (Tất cả người dùng)</option>
                  <option value="user">Gửi cho một khách hàng cụ thể</option>
                </Select>

                {targetType === 'user' ? (
                  <Select
                    label="Chọn Khách Hàng *"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    required
                  >
                    <option value="">-- Chọn tài khoản --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.full_name || 'Khách hàng'} ({c.email})
                      </option>
                    ))}
                  </Select>
                ) : (
                  <Select
                    label="Phân Loại Thông Báo"
                    value={notifType}
                    onChange={(e) => setNotifType(e.target.value)}
                  >
                    <option value="promotion">Khuyến mãi & Voucher (Promotion)</option>
                    <option value="system">Hệ thống & AI Update (System)</option>
                    <option value="order">Đơn hàng & Đặt cọc (Order)</option>
                    <option value="test_drive">Lái thử xe (Test Drive)</option>
                  </Select>
                )}
              </div>

              <Input
                label="Tiêu Đề Thông Báo *"
                placeholder="VD: Ưu Đãi Đặc Quyền Mùa Thu..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              <Textarea
                label="Nội Dung Thông Báo Chi Tiết *"
                rows={4}
                placeholder="Nhập nội dung ngắn gọn, súc tích..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />

              {/* Sample Quick Templates */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Mẫu Soạn Sẵn:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {templates.map((t, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setTitle(t.title);
                        setContent(t.content);
                        setNotifType(t.type);
                      }}
                      className="p-2.5 text-left bg-slate-50 hover:bg-blue-50/60 rounded-xl border border-slate-200/80 transition-all text-xs space-y-1 cursor-pointer"
                    >
                      <p className="font-bold text-slate-800 truncate">{t.title}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-2">{t.content}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <Button
                  variant="primary"
                  type="submit"
                  size="md"
                  leftIcon={<Send className="w-4 h-4" />}
                  isLoading={isSending}
                >
                  Phát Thông Báo Ngay
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Sent History (1 col) */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-600" />
                Lịch Sử Thông Báo
              </CardTitle>
              <CardDescription>{notifications.length} thông báo đã lưu</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="p-0 max-h-125 overflow-y-auto divide-y divide-slate-100">
            {notifications.map((notif) => (
              <div key={notif.id} className="p-4 space-y-1.5 hover:bg-slate-50/60 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <h5 className="font-bold text-xs text-slate-900 leading-snug">{notif.title}</h5>
                  <Badge variant={notif.type === 'system' ? 'secondary' : 'primary'} size="sm">
                    {notif.type || 'broadcast'}
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{notif.content}</p>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                  <span>{notif.user_id ? 'Gửi cá nhân' : 'Toàn hệ thống'}</span>
                  <span>{formatDateTime(notif.created_at)}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
