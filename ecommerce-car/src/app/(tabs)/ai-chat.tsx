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
import { colors, radii, spacing, typography } from '../../theme';
import { UIChatMessage } from '../../types/ui';
import { historyService } from '../../services/historyService';
import { useAuthStore } from '../../store/useAuthStore';
import { useCartStore } from '../../store/useCartStore';
import { globalAlert } from '../../store/useDialogStore';
import { ChatBubble } from '../../components/chat/ChatBubble';
import { QuickPrompts } from '../../components/chat/QuickPrompts';
import { CarResponse, SearchDataEvent, SearchProgressEvent } from '../../types';
import { aiSseService, SseEventTypes } from '../../services/aiSseService';

const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {}
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export default function AIChatScreen() {
  const params = useLocalSearchParams<{ initialPrompt?: string }>();
  const { user } = useAuthStore();
  const { addToCart } = useCartStore();
  const [input, setInput] = useState('');
  const [sessionId] = useState(() => generateUUID());
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

  // Clean up SSE listeners on unmount
  useEffect(() => {
    return () => {
      aiSseService.cleanup();
    };
  }, []);

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

      setMessages((prev) => [...prev, userMsg, aiPlaceholder]);
      setInput('');
      setIsTyping(true);

      if (user?.id) {
        historyService.saveSearchQuery(user.id, query).catch(() => {});
      }

      // Cleanup prior SSE listeners
      aiSseService.off(SseEventTypes.PROGRESS);
      aiSseService.off(SseEventTypes.SEARCH_DATA);
      aiSseService.off(SseEventTypes.MESSAGE);
      aiSseService.off(SseEventTypes.DONE);
      aiSseService.off(SseEventTypes.ERROR);
      aiSseService.off(SseEventTypes.CLOSE);

      // Listen for progress updates
      aiSseService.on<SearchProgressEvent>(SseEventTypes.PROGRESS, (data) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  progress: data,
                }
              : msg
          )
        );
      });

      // Listen for search data (cars, constraints, conflict)
      aiSseService.on<SearchDataEvent>(SseEventTypes.SEARCH_DATA, (data) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
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
      });

      // Listen for streaming message chunks
      aiSseService.on<{ text: string }>(SseEventTypes.MESSAGE, (data) => {
        if (!data || !data.text) return;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  content: msg.content + data.text,
                }
              : msg
          )
        );
      });

      // Listen for completion
      aiSseService.on(SseEventTypes.DONE, () => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
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
      });

      // Listen for error
      aiSseService.on<{ message: string }>(SseEventTypes.ERROR, (err) => {
        console.error('[AI Chat] SSE error:', err);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
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
      });

      // Listen for close
      aiSseService.on(SseEventTypes.CLOSE, () => {
        setIsTyping(false);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId && msg.isStreaming
              ? { ...msg, isStreaming: false }
              : msg
          )
        );
      });

      // Initiate connection
      aiSseService.connect(query, sessionId);
    },
    [input, user, sessionId]
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={85}
    >
      <View style={styles.headerInfo}>
        <View style={styles.headerInner}>
          <View style={styles.liveDot} />
          <Text style={styles.headerText}>AutoMatch RAG AI • SSE Trực Tuyến</Text>
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
      <View style={styles.inputBar}>
        <View style={styles.inputBarInner}>
          <TextInput
            style={styles.textInput}
            placeholder="Nhập yêu cầu tìm xe (vd: SUV gầm cao dưới 1 tỷ)..."
            placeholderTextColor={colors.textMuted}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => handleSendMessage()}
            returnKeyType="send"
          />
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.sendBtn, (!input.trim() || isTyping) && styles.sendBtnDisabled]}
            disabled={!input.trim() || isTyping}
            onPress={() => handleSendMessage()}
          >
            <Ionicons
              name={isTyping ? 'hourglass-outline' : 'arrow-up'}
              size={16}
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
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
    paddingVertical: 6,
  },
  headerInner: {
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 10,
    fontWeight: typography.weights.medium,
    letterSpacing: 0.2,
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
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
    paddingVertical: spacing.sm,
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
  textInput: {
    flex: 1,
    height: 42,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: typography.sizes.xs + 1,
    paddingVertical: 0,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: colors.surfaceElevated,
  },
});
