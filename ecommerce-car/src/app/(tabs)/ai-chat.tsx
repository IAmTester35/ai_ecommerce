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
import { colors, radii, typography } from '../../theme';
import { UIChatMessage } from '../../types/ui';
import { historyService } from '../../services/historyService';
import { useAuthStore } from '../../store/useAuthStore';
import { ChatBubble } from '../../components/chat/ChatBubble';
import { QuickPrompts } from '../../components/chat/QuickPrompts';
import { CarResponse } from '../../types';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

export default function AIChatScreen() {
  const params = useLocalSearchParams<{ initialPrompt?: string }>();
  const { user } = useAuthStore();
  const [input, setInput] = useState('');
  const [sessionId] = useState(() => `session-${Math.random().toString(36).substring(2, 9)}`);
  const [messages, setMessages] = useState<UIChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content:
        'Xin chào! Tôi là AutoMatch AI — Trợ lý tư vấn ô tô thông minh kết nối hệ thống RAG & Supabase. Bạn có thể mô tả nhu cầu, ví dụ: "Xe SUV 7 chỗ cách âm tốt giá 1.5 tỷ", "Xe thể thao 2 cửa",...',
      timestamp: '09:00',
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

      try {
        // Call FastAPI Backend RAG Search
        const response = await fetch(`${BASE_URL}/api/search`, {
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
              `Dựa trên yêu cầu "${query}", AutoMatch AI đã tìm kiếm trong kho xe và gợi ý các lựa chọn phù hợp nhất:`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            conflictDetected: searchData?.conflict_detected || false,
            relaxedTerms: searchData?.relaxed_terms || undefined,
            suggestedCars,
          };

          setMessages((prev) => [...prev, aiReply]);
        } else {
          throw new Error('Backend AI response error');
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Math.random().toString(36).substring(2, 9)}`,
            role: 'assistant',
            content: `Hệ thống AutoMatch AI đang kết nối. Bạn có thể xem toàn bộ kho xe tại mục Showroom.`,
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

  const handleCarCompare = () => {
    router.push('/(tabs)/compare' as any);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.headerInfo}>
        <Ionicons name="sparkles" size={16} color={colors.primary} />
        <Text style={styles.headerText}>AutoMatch RAG Engine: Online (Supabase & FastAPI)</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChatBubble
            message={item}
            onPressCarDetails={handleCarDetails}
            onPressCarCompare={handleCarCompare}
          />
        )}
        contentContainerStyle={styles.chatList}
        ListFooterComponent={
          isTyping ? (
            <View style={styles.typingIndicator}>
              <Text style={styles.typingText}>🤖 AutoMatch AI đang truy xuất dữ liệu & suy luận...</Text>
            </View>
          ) : null
        }
      />

      {messages.length <= 2 && (
        <QuickPrompts onSelectPrompt={(p) => handleSendMessage(p)} />
      )}

      {/* Input Field Bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.textInput}
          placeholder="Mô tả nhu cầu mua xe của bạn..."
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
          <Ionicons name="send" size={18} color={input.trim() ? colors.textDark : colors.textMuted} />
        </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: typography.weights.bold,
  },
  chatList: {
    paddingVertical: 12,
  },
  typingIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  typingText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontStyle: 'italic',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  textInput: {
    flex: 1,
    height: 42,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.full,
    paddingHorizontal: 16,
    color: colors.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: colors.surfaceElevated,
  },
});
