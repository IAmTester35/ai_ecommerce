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
import { aiSearchService } from '../../services/aiSearchService';
import { CarResponse, SearchProgressEvent } from '../../types';

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
  const isCancelledRef = useRef<boolean>(false);
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

  const updateMessageProgress = useCallback((msgId: string, progress: SearchProgressEvent) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === msgId
          ? {
              ...msg,
              progress,
            }
          : msg
      )
    );
  }, []);

  const handleSendMessage = useCallback(
    async (textToSend?: string) => {
      const query = (textToSend || input).trim();
      if (!query || isTyping) return;

      isCancelledRef.current = false;
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
          detail: 'Bóc tách ngân sách, thương hiệu & tiêu chí kỹ thuật...',
        },
      };

      activeAssistantMsgIdRef.current = assistantMsgId;
      setMessages((prev) => [...prev, userMsg, aiPlaceholder]);
      setInput('');
      setIsTyping(true);

      if (user?.id) {
        historyService.saveSearchQuery(user.id, query).catch(() => {});
      }

      // Simulated progressive stages while waiting for HTTP response
      const timer1 = setTimeout(() => {
        if (!isCancelledRef.current) {
          updateMessageProgress(assistantMsgId, {
            stage: 'searching',
            step: 2,
            total_steps: 4,
            label: 'Truy vấn kho xe',
            detail: 'Tìm kiếm xe phù hợp trong kho dữ liệu AutoMatch...',
          });
        }
      }, 700);

      const timer2 = setTimeout(() => {
        if (!isCancelledRef.current) {
          updateMessageProgress(assistantMsgId, {
            stage: 'enriching',
            step: 3,
            total_steps: 4,
            label: 'Tải thông số & hình ảnh',
            detail: 'Đối chiếu thông số kỹ thuật và hình ảnh thực tế...',
          });
        }
      }, 1500);

      const timer3 = setTimeout(() => {
        if (!isCancelledRef.current) {
          updateMessageProgress(assistantMsgId, {
            stage: 'generating',
            step: 4,
            total_steps: 4,
            label: 'AI đang tư vấn',
            detail: 'Tổng hợp đánh giá chuyên sâu & phân tích đề xuất...',
          });
        }
      }, 2400);

      try {
        const data = await aiSearchService.searchCars(query, sessionId);
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);

        if (isCancelledRef.current) return;

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  content: data.ai_message || '',
                  suggestedCars: data.results || [],
                  conflictDetected: data.conflict_detected || false,
                  relaxedTerms: data.relaxed_terms || undefined,
                  extractedConstraints: data.constraints || undefined,
                  isStreaming: false,
                  progress: {
                    stage: 'completed',
                    step: 4,
                    total_steps: 4,
                    label: 'Hoàn tất',
                  },
                }
              : msg
          )
        );
      } catch (err: any) {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);

        if (isCancelledRef.current) return;

        console.error('[AI Chat] Search error:', err);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  isStreaming: false,
                  content:
                    err.message ||
                    'Hệ thống AI đang bảo trì hoặc mất kết nối máy chủ. Quý khách vui lòng thử lại sau giây lát.',
                  progress: undefined,
                }
              : msg
          )
        );
      } finally {
        setIsTyping(false);
      }
    },
    [input, isTyping, sessionId, updateMessageProgress, user]
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
    isCancelledRef.current = true;
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
