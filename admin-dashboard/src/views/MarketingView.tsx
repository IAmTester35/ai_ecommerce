import React, { useState } from 'react';
import {
  Ticket,
  MessageSquare,
  Bell,
  Sparkles,
} from 'lucide-react';
import { VouchersView } from './VouchersView';
import { ReviewsQAView } from './ReviewsQAView';
import { NotificationsView } from './NotificationsView';
import { useData } from '../context/DataContext';
import { cn } from '../lib/utils';

export type MarketingTab = 'vouchers' | 'reviews' | 'notifications';

interface MarketingViewProps {
  initialTab?: MarketingTab;
}

export const MarketingView: React.FC<MarketingViewProps> = ({ initialTab = 'vouchers' }) => {
  const [activeTab, setActiveTab] = useState<MarketingTab>(initialTab);
  const { vouchers, reviews, carQAs, notifications } = useData();

  const activeVouchersCount = vouchers.filter((v) => v.is_active).length;
  const pendingReviewsCount = reviews.filter((r) => r.is_approved === false).length;
  const pendingQAsCount = carQAs.filter((qa) => !qa.answer).length;
  const totalEngagementAlerts = pendingReviewsCount + pendingQAsCount;

  return (
    <div className="space-y-6 text-left">
      {/* Module Navigation Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('vouchers')}
            className={cn(
              'flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
              activeTab === 'vouchers'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            )}
          >
            <Ticket className="w-4 h-4" />
            <span>Khuyến Mãi & Voucher</span>
            <span
              className={cn(
                'text-[10px] px-2 py-0.5 rounded-full font-bold',
                activeTab === 'vouchers'
                  ? 'bg-blue-700 text-blue-100'
                  : 'bg-slate-200/80 text-slate-700'
              )}
            >
              {activeVouchersCount} đang chạy
            </span>
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={cn(
              'flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
              activeTab === 'reviews'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            )}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Đánh Giá & Q&A AI</span>
            {totalEngagementAlerts > 0 ? (
              <span
                className={cn(
                  'text-[10px] px-2 py-0.5 rounded-full font-bold',
                  activeTab === 'reviews'
                    ? 'bg-amber-400 text-amber-950'
                    : 'bg-amber-100 text-amber-800'
                )}
              >
                {totalEngagementAlerts} cần duyệt
              </span>
            ) : (
              <span
                className={cn(
                  'text-[10px] px-2 py-0.5 rounded-full font-bold',
                  activeTab === 'reviews'
                    ? 'bg-blue-700 text-blue-100'
                    : 'bg-slate-200/80 text-slate-700'
                )}
              >
                {reviews.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={cn(
              'flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
              activeTab === 'notifications'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            )}
          >
            <Bell className="w-4 h-4" />
            <span>Thông Báo Push</span>
            <span
              className={cn(
                'text-[10px] px-2 py-0.5 rounded-full font-bold',
                activeTab === 'notifications'
                  ? 'bg-blue-700 text-blue-100'
                  : 'bg-slate-200/80 text-slate-700'
              )}
            >
              {notifications.length}
            </span>
          </button>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 px-3">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span className="font-medium">Marketing & Customer Engagement Hub</span>
        </div>
      </div>

      {/* Render Active Sub-View */}
      <div className="transition-all duration-200">
        {activeTab === 'vouchers' && <VouchersView />}
        {activeTab === 'reviews' && <ReviewsQAView />}
        {activeTab === 'notifications' && <NotificationsView />}
      </div>
    </div>
  );
};
