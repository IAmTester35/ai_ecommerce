import React, { useState, useMemo } from 'react';
import {
  MessageSquare,
  Bot,
  User,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import type { ChatSessionMessage, Profile } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { SearchBar } from '../components/ui/SearchBar';
import { EmptyState } from '../components/ui/EmptyState';
import { formatDateTime, cn } from '../lib/utils';

export const AiChatInspector: React.FC = () => {
  const { chatSessions } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  // Group messages by session_id
  const sessionsMap = useMemo(() => {
    const map = new Map<string, {
      sessionId: string;
      userId: string | null;
      profile: Profile | null;
      messages: ChatSessionMessage[];
      lastActive: string;
    }>();

    chatSessions.forEach((item) => {
      const sid = item.session_id;
      if (!map.has(sid)) {
        map.set(sid, {
          sessionId: sid,
          userId: item.user_id || null,
          profile: item.profile || null,
          messages: [],
          lastActive: item.created_at,
        });
      }
      const entry = map.get(sid)!;
      entry.messages.push(item);
      if (new Date(item.created_at) > new Date(entry.lastActive)) {
        entry.lastActive = item.created_at;
      }
    });

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime()
    );
  }, [chatSessions]);

  // Filter sessions
  const filteredSessions = useMemo(() => {
    return sessionsMap.filter((s) => {
      const matchSearch =
        `${s.sessionId} ${s.profile?.full_name || ''} ${s.profile?.email || ''} ${s.messages
          .map((m) => m.content || '')
          .join(' ')}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      return matchSearch;
    });
  }, [sessionsMap, searchTerm]);

  // Set active session default if none selected
  const activeSession = useMemo(() => {
    if (selectedSessionId) {
      return sessionsMap.find((s) => s.sessionId === selectedSessionId) || null;
    }
    return filteredSessions[0] || null;
  }, [sessionsMap, selectedSessionId, filteredSessions]);

  return (
    <div className="space-y-8 text-left">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Lịch Sử Chat AI Trợ Lý
            </h2>
            <Badge variant="secondary" size="md">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              chat_sessions RLS Audit
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal">
            Giám sát thời gian thực các phiên hội thoại khách hàng với Trợ lý AI
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Badge variant="primary" size="md">
            {sessionsMap.length} phiên hội thoại
          </Badge>
          <Badge variant="neutral" size="md">
            {chatSessions.length} tin nhắn
          </Badge>
        </div>
      </div>

      {/* Main Split Layout: Session List on Left, Chat Transcript on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 items-start">
        {/* Left Column: Sessions List */}
        <div className="lg:col-span-5 space-y-3.5">
          <SearchBar
            placeholder="Tìm theo mã phiên, tên khách, nội dung chat..."
            value={searchTerm}
            onChange={setSearchTerm}
          />

          <div className="space-y-2 max-h-155 overflow-y-auto pr-1">
            {filteredSessions.length === 0 ? (
              <EmptyState
                icon={<MessageSquare className="w-8 h-8 text-slate-300" />}
                title="Không có phiên chat nào"
                description="Các phiên trao đổi với Trợ lý AI sẽ tự động xuất hiện tại đây."
              />
            ) : (
              filteredSessions.map((session) => {
                const isSelected = activeSession?.sessionId === session.sessionId;
                const lastMsg = session.messages[session.messages.length - 1];

                return (
                  <div
                    key={session.sessionId}
                    onClick={() => setSelectedSessionId(session.sessionId)}
                    className={cn(
                      'p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2',
                      isSelected
                        ? 'bg-blue-50/70 border-blue-300 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-xs text-slate-900 leading-none">
                            {session.profile?.full_name || 'Khách vãng lai'}
                          </p>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ID: {session.sessionId.slice(0, 8)}
                          </span>
                        </div>
                      </div>

                      <Badge variant={session.profile ? 'primary' : 'neutral'} size="sm">
                        {session.messages.length} tin
                      </Badge>
                    </div>

                    {lastMsg && (
                      <p className="text-[11px] text-slate-600 line-clamp-1 italic">
                        "{lastMsg.content}"
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDateTime(session.lastActive)}
                      </span>
                      {session.profile?.email && (
                        <span className="truncate max-w-37.5">{session.profile.email}</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Chat Transcript Inspector */}
        <div className="lg:col-span-7">
          {activeSession ? (
            <Card className="overflow-hidden">
              <CardHeader className="bg-slate-50 border-b border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm">
                        Chi Tiết Phiên: #{activeSession.sessionId.slice(0, 12)}
                      </CardTitle>
                      <p className="text-[11px] text-slate-500">
                        Khách hàng: <strong>{activeSession.profile?.full_name || 'Chưa đăng nhập'}</strong> (
                        {activeSession.profile?.email || 'Khách vãng lai'})
                      </p>
                    </div>
                  </div>

                  <Badge variant="secondary" size="sm">
                    {activeSession.messages.length} lượt tương tác
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-4 max-h-137.5 overflow-y-auto bg-slate-50/30">
                {activeSession.messages.map((item, idx) => {
                  const role = item.role || 'user';
                  const isUser = role === 'user';
                  const content = item.content || '';

                  return (
                    <div
                      key={item.id || idx}
                      className={cn(
                        'flex gap-3 max-w-[88%]',
                        isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                      )}
                    >
                      <div
                        className={cn(
                          'w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-white text-xs',
                          isUser ? 'bg-blue-600' : 'bg-indigo-600'
                        )}
                      >
                        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>

                      <div className="space-y-1">
                        <div
                          className={cn(
                            'p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap shadow-2xs',
                            isUser
                              ? 'bg-blue-600 text-white rounded-tr-xs'
                              : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                          )}
                        >
                          {content}
                        </div>
                        <span
                          className={cn(
                            'text-[10px] text-slate-400 block px-1',
                            isUser ? 'text-right' : 'text-left'
                          )}
                        >
                          {formatDateTime(item.created_at)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ) : (
            <Card className="p-12 text-center text-slate-400 text-xs">
              Chọn một phiên hội thoại ở danh sách bên trái để kiểm tra chi tiết nội dung chat
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
