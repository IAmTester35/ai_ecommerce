import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, spacing, typography } from '../../theme';
import { UIChatMessage } from '../../types/ui';
import { historyService } from '../../services/historyService';
import { useAuthStore } from '../../store/useAuthStore';
import { useCartStore } from '../../store/useCartStore';
import { globalAlert } from '../../store/useDialogStore';
import { ChatBubble } from '../../components/chat/ChatBubble';
import { QuickPrompts } from '../../components/chat/QuickPrompts';
import { useNitroSse } from 'react-native-nitro-sse';
import { supabase } from '../../api/supabaseClient';
import { getApiBaseUrl } from '../../config/api';
import { CarResponse, SearchDataEvent, SearchProgressEvent } from '../../types';

const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch { }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export default function AIChatScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ initialPrompt?: string }>();
  const { user } = useAuthStore();
  const { addToCart } = useCartStore();
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState(() => generateUUID());
  const [activePrompt, setActivePrompt] = useState<{ query: string; id: string } | null>(null);
  const activeAssistantMsgIdRef = useRef<string | null>(null);
  const [messages, setMessages] = useState<UIChatMessage[]>(() => [
    {
      id: 'welcome-msg',
      role: 'assistant',
      content:
        'Xin chào! Tôi là trợ lý AI AutoMatch. Hãy nêu ngân sách, dòng xe hoặc thông số bạn mong muốn để nhận tư vấn chính xác.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const initialPromptHandled = useRef(false);

  // Auto scroll to bottom when messages update
  useEffect(() => {
    const timer = setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 60);
    return () => clearTimeout(timer);
  }, [messages, isTyping]);

  const { stop: cancelStream } = useNitroSse({
    url: activePrompt
      ? `${getApiBaseUrl()}/api/search?r=${encodeURIComponent(activePrompt.id)}`
      : '',
    method: 'post',
    body: activePrompt
      ? JSON.stringify({
          query: activePrompt.query,
          session_id: sessionId,
        })
      : undefined,
    autoStart: true,
    batchingIntervalMs: 20,
    autoParseJSON: true,
    monitorNetwork: true,
    onBeforeRequest: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        Connection: 'keep-alive',
        'Cache-Control': 'no-cache',
        Accept: 'text/event-stream',
        'Content-Type': 'application/json',
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      return headers;
    },
    events: {
      progress: (e) => {
        const data = (e.parsedData ||
          (typeof e.data === 'string' && e.data.trim().startsWith('{')
            ? JSON.parse(e.data)
            : e.data)) as SearchProgressEvent;
        if (data) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === activeAssistantMsgIdRef.current
                ? {
                    ...msg,
                    progress: data,
                  }
                : msg
            )
          );
        }
      },
      search_data: (e) => {
        const data = (e.parsedData ||
          (typeof e.data === 'string' && e.data.trim().startsWith('{')
            ? JSON.parse(e.data)
            : e.data)) as SearchDataEvent;
        if (data) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === activeAssistantMsgIdRef.current
                ? {
                    ...msg,
                    suggestedCars: data.results || [],
                    conflictDetected: data.conflict_detected || false,
                    relaxedTerms: data.relaxed_terms || undefined,
                    extractedConstraints: data.constraints || undefined,
                  }
                : msg
            )
          );
        }
      },
      done: () => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === activeAssistantMsgIdRef.current
              ? {
                  ...msg,
                  isStreaming: false,
                  progress: msg.progress
                    ? { ...msg.progress, stage: 'completed', step: 4 }
                    : undefined,
                }
              : msg
          )
        );
        setIsTyping(false);
        setActivePrompt(null);
      },
      error: (e) => {
        const payload =
          (e.parsedData as any) ||
          (typeof e.data === 'string' && e.data.trim().startsWith('{')
            ? JSON.parse(e.data)
            : null);
        const errorMsg =
          payload?.error ||
          payload?.message ||
          e.message ||
          (typeof e.data === 'string' ? e.data : 'Lỗi kết nối máy chủ');
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === activeAssistantMsgIdRef.current
              ? {
                  ...msg,
                  isStreaming: false,
                  content: msg.content || errorMsg,
                  progress: undefined,
                }
              : msg
          )
        );
        setIsTyping(false);
        setActivePrompt(null);
      },
    },
    onMessage: (e) => {
      if (!e.event || e.event === 'message') {
        const text =
          (e.parsedData as any)?.text ??
          (typeof e.data === 'string' && e.data.trim().startsWith('{')
            ? JSON.parse(e.data).text
            : typeof e.data === 'string'
            ? e.data
            : '');
        if (text) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === activeAssistantMsgIdRef.current
                ? {
                    ...msg,
                    content: msg.content + text,
                  }
                : msg
            )
          );
        }
      }
    },
    onError: (e) => {
      console.error('[AI Chat] SSE error:', e);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === activeAssistantMsgIdRef.current
            ? {
                ...msg,
                isStreaming: false,
                content:
                  msg.content ||
                  'Hệ thống AI đang bảo trì hoặc mất kết nối máy chủ. Quý khách vui lòng thử lại sau giây lát.',
                progress: undefined,
              }
            : msg
        )
      );
      setIsTyping(false);
      setActivePrompt(null);
    },
    onClose: () => {
      setIsTyping(false);
      setActivePrompt(null);
    },
  });

  const handleSendMessage = useCallback(
    async (textToSend?: string) => {
      const query = (textToSend || input).trim();
      if (!query) return;

      const userMsg: UIChatMessage = {
        id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        role: 'user',
        content: query,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      const assistantMsgId = `ai-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const aiPlaceholder: UIChatMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isStreaming: true,
        progress: {
          stage: 'analyzing',
          step: 1,
          total_steps: 4,
          label: 'Phân tích yêu cầu',
          detail: 'Đang bóc tách ngân sách, thương hiệu & tiêu chí...',
        },
      };

      activeAssistantMsgIdRef.current = assistantMsgId;
      setMessages((prev) => [...prev, userMsg, aiPlaceholder]);
      setInput('');
      setIsTyping(true);

      if (user?.id) {
        historyService.saveSearchQuery(user.id, query).catch(() => { });
      }

      setActivePrompt({
        query,
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      });
    },
    [input, user]
  );

  useEffect(() => {
    if (params.initialPrompt && !initialPromptHandled.current) {
      initialPromptHandled.current = true;
      const timer = setTimeout(() => {
        handleSendMessage(params.initialPrompt);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [params.initialPrompt, handleSendMessage]);

  const handleCarDetails = (carId: string) => {
    router.push(`/car/${carId}` as any);
  };

  const handleCarCompare = (car: CarResponse) => {
    router.push({
      pathname: '/(tabs)/compare',
      params: { ids: car.id },
    } as any);
  };

  const handleCompareAll = (cars: CarResponse[]) => {
    const ids = cars.map((c) => c.id).join(',');
    router.push({
      pathname: '/(tabs)/compare',
      params: { ids },
    } as any);
  };

  const handleAddToCart = async (carId: string) => {
    if (!user) {
      globalAlert('Yêu cầu đăng nhập', 'Vui lòng đăng nhập để thêm xe vào danh sách đặt cọc.', [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đăng nhập', onPress: () => router.push('/(auth)/login' as any) },
      ]);
      return;
    }
    try {
      await addToCart(user.id, carId, 1);
      globalAlert('Thành công', 'Đã thêm xe vào danh sách đặt cọc.', [
        { text: 'Xem tiếp', style: 'cancel' },
        { text: 'Xem giỏ hàng', onPress: () => router.push('/cart' as any) },
      ]);
    } catch (err: any) {
      globalAlert('Lỗi', err.message || 'Không thể thêm vào giỏ hàng.');
    }
  };

  const handleNewChat = () => {
    cancelStream();
    setActivePrompt(null);
    setSessionId(generateUUID());
    setIsTyping(false);
    setMessages([
      {
        id: `welcome-msg-${Date.now()}`,
        role: 'assistant',
        content:
          'Xin chào! Tôi là trợ lý AI AutoMatch. Hãy nêu ngân sách, dòng xe hoặc thông số bạn mong muốn để nhận tư vấn chính xác.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setInput('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 95 : 0}
    >
      <View style={styles.headerInfo}>
        <View style={styles.headerInner}>
          <View style={styles.headerStatusRow}>
            <View style={styles.liveDot} />
            <Text style={styles.headerText}>Chuyên gia AI AutoMatch • Trực tuyến 24/7</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.newChatBtn}
            onPress={handleNewChat}
          >
            <Ionicons name="refresh-outline" size={13} color={colors.textSecondary} />
            <Text style={styles.newChatBtnText}>Đoạn chat mới</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.chatArea}>
        <View style={styles.chatAreaInner}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <ChatBubble
                message={item}
                onPressCarDetails={handleCarDetails}
                onPressCarCompare={handleCarCompare}
                onPressCompareAll={handleCompareAll}
                onPressAddToCart={handleAddToCart}
              />
            )}
            contentContainerStyle={styles.chatList}
          />

          {messages.length <= 2 && (
            <QuickPrompts onSelectPrompt={(p) => handleSendMessage(p)} />
          )}
        </View>
      </View>

      {/* Input Field Bar */}
      <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.inputBarInner}>
          <View style={styles.inputWrapper}>
            <Ionicons name="sparkles" size={14} color={colors.primaryHover} style={styles.sparkleIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="Nhập yêu cầu (vd: SUV gầm cao dưới 2 tỷ)..."
              placeholderTextColor={colors.textMuted}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={() => handleSendMessage()}
              returnKeyType="send"
            />
            {input.length > 0 && (
              <TouchableOpacity
                onPress={() => setInput('')}
                style={styles.clearInputBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.sendBtn, (!input.trim() || isTyping) && styles.sendBtnDisabled]}
            disabled={!input.trim() || isTyping}
            onPress={() => handleSendMessage()}
          >
            <Ionicons
              name={isTyping ? 'hourglass-outline' : 'arrow-up'}
              size={18}
              color={input.trim() && !isTyping ? '#FFFFFF' : colors.textMuted}
            />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerInfo: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 8,
    paddingHorizontal: spacing.lg,
  },
  headerInner: {
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  headerText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: typography.weights.medium,
  },
  newChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.full,
    gap: 4,
  },
  newChatBtnText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: typography.weights.medium,
  },
  chatArea: {
    flex: 1,
    width: '100%',
  },
  chatAreaInner: {
    flex: 1,
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center',
  },
  chatList: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  inputBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: spacing.xs + 2,
  },
  inputBarInner: {
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.xs + 2,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: spacing.md,
    height: 44,
  },
  sparkleIcon: {
    marginRight: 6,
  },
  textInput: {
    flex: 1,
    height: 44,
    color: colors.text,
    fontSize: typography.sizes.xs + 1,
    paddingVertical: 0,
  },
  clearInputBtn: {
    padding: 4,
    marginLeft: 4,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: colors.surfaceElevated,
  },
});
