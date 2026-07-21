import React from 'react';
import { User, Sparkles, AlertTriangle } from 'lucide-react';
import { SearchResponse } from '@/lib/api';
import { CarCard } from './CarCard';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content?: string;
  data?: SearchResponse;
}

export function ChatMessage({ role, content, data }: ChatMessageProps) {
  if (role === 'user') {
    return (
      <div className="flex gap-4 p-6 my-4 w-full">
        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
          <User className="w-5 h-5 text-secondary-foreground" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="font-semibold">Bạn</div>
          <p className="text-foreground text-lg leading-relaxed">{content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-4 p-6 my-4 w-full bg-secondary/30 rounded-3xl">
      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
        <Sparkles className="w-5 h-5 text-primary-foreground" />
      </div>
      <div className="flex-1 space-y-6">
        <div className="font-semibold">AutoMatch AI</div>
        
        {data?.conflict_detected && (
          <div className="flex items-start gap-3 p-4 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-2xl border border-orange-500/20">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium">Phát hiện mâu thuẫn yêu cầu</p>
              <p className="text-sm opacity-90">
                Hệ thống nhận thấy yêu cầu của bạn có điểm mâu thuẫn (ví dụ: mức giá không khớp với loại động cơ/xe yêu cầu). Chúng tôi đã tự động nới lỏng tiêu chí để tìm ra các lựa chọn thay thế tốt nhất dưới đây.
              </p>
            </div>
          </div>
        )}

        {data?.ai_message && (
          <div className="prose prose-p:leading-relaxed max-w-none text-foreground">
            {data.ai_message.split('\n').map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        )}

        {data?.results && data.results.length > 0 && (
          <div className="flex flex-col gap-4 mt-6">
            <h4 className="text-lg font-semibold mb-2">Đề xuất phù hợp nhất:</h4>
            {data.results.map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
