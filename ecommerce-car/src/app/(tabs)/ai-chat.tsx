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
  ActivityIndicator,
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
import { CarResponse } from '../../types';
import { getApiBaseUrl } from '../../config/api';

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

  useEffect(() => {
    const timer = setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, isTyping]);

  const handleSendMessage = useCallback(
    async (textToSend?: string) => {
      const query = (textToSend || input).trim();
      if (!query) return;

      const userMsg: UIChatMessage = {
        id: `user-${Math.random().toString(36).substring(2, 9)}`,
        role: 'user',
        content: query,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setIsTyping(true);

      if (user?.id) {
        historyService.saveSearchQuery(user.id, query).catch(() => {});
      }

      const baseUrl = getApiBaseUrl();
      console.log(`[AI Chat] Requesting ${baseUrl}/api/search for query: "${query}"`);

      try {
        // Call FastAPI Backend RAG Search
        const response = await fetch(`${baseUrl}/api/search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query,
            session_id: sessionId,
          }),
        });

        if (response.ok) {
          const rawText = await response.text();
          let searchData: any = null;
          let assistantText = '';

          const lines = rawText.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const parsed = JSON.parse(line.slice(6));
                if (parsed.results) {
                  searchData = parsed;
                }
                if (parsed.text) {
                  assistantText += parsed.text;
                }
              } catch {
                // Ignore non-json lines
              }
            }
          }

          const suggestedCars: CarResponse[] = searchData?.results || [];

          const aiReply: UIChatMessage = {
            id: `ai-${Math.random().toString(36).substring(2, 9)}`,
            role: 'assistant',
            content:
              assistantText.trim() ||
              searchData?.ai_message ||
              `Dựa trên yêu cầu "${query}", AutoMatch đã đối chiếu cơ sở dữ liệu và đề xuất các mẫu xe phù hợp:`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            conflictDetected: searchData?.conflict_detected || false,
            relaxedTerms: searchData?.relaxed_terms || undefined,
            suggestedCars,
          };

          setMessages((prev) => [...prev, aiReply]);
        } else {
          const errBody = await response.text().catch(() => '');
          console.error('[AI Chat] Backend error response:', response.status, errBody);
          throw new Error(`Backend AI response status: ${response.status}`);
        }
      } catch (err: any) {
        console.error('[AI Chat] Failed to connect to backend:', err);
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Math.random().toString(36).substring(2, 9)}`,
            role: 'assistant',
            content: `Hệ thống AI đang kết nối lại (${baseUrl}). Bạn có thể khám phá trực tiếp tại mục Kho xe hoặc thử lại sau giây lát.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } finally {
        setIsTyping(false);
      }
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
          <Text style={styles.headerText}>AutoMatch RAG AI • Trực Tuyến</Text>
        </View>
      </View>

      <View style={styles.chatArea}>
        <View style={styles.chatAreaInner}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
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
            ListFooterComponent={
              isTyping ? (
                <View style={styles.typingIndicator}>
                  <ActivityIndicator size="small" color={colors.primaryHover} style={{ marginRight: 6 }} />
                  <Text style={styles.typingText}>AI đang phân tích & đối chiếu...</Text>
                </View>
              ) : null
            }
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
            placeholder="Nhập yêu cầu tìm xe..."
            placeholderTextColor={colors.textMuted}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => handleSendMessage()}
            returnKeyType="send"
          />
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
            disabled={!input.trim()}
            onPress={() => handleSendMessage()}
          >
            <Ionicons name="arrow-up" size={16} color={input.trim() ? '#FFFFFF' : colors.textMuted} />
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
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 4,
  },
  typingText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontStyle: 'italic',
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
