import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { colors } from '../../theme/colors';
import { QuickPrompt } from '../../types/ui';
import { historyService } from '../../services/historyService';
import { useAuthStore } from '../../store/useAuthStore';

interface QuickPromptsProps {
  onSelectPrompt: (promptText: string) => void;
}

const DEFAULT_SEARCH_PROMPTS: QuickPrompt[] = [
  {
    id: '1',
    icon: '🏎️',
    title: 'Mâu thuẫn V12 & Giá rẻ',
    prompt: 'Tôi muốn tìm xe động cơ V12, phong cách thể thao đi dạo phố nhưng giá dưới 1 tỷ',
  },
  {
    id: '2',
    icon: '🚙',
    title: 'SUV Gia đình',
    prompt: 'Tìm xe SUV 7 chỗ gầm cao, an toàn tốt, tiết kiệm nhiên liệu trong tầm giá 1.2 tỷ',
  },
  {
    id: '3',
    icon: '⚡',
    title: 'Xe Điện Hiện Đại',
    prompt: 'Đề xuất xe điện tự lái tốt, quãng đường chạy trên 450km/lần sạc',
  },
  {
    id: '4',
    icon: '💼',
    title: 'Sedan Doanh Nhân',
    prompt: 'Tư vấn xe Sedan sang trọng cách âm tốt cho doanh nhân giá khoảng 2 tỷ',
  },
];

export const QuickPrompts: React.FC<QuickPromptsProps> = ({ onSelectPrompt }) => {
  const { user } = useAuthStore();
  const [prompts, setPrompts] = useState<QuickPrompt[]>(DEFAULT_SEARCH_PROMPTS);

  useEffect(() => {
    if (!user) return;
    historyService
      .getSearchHistory(user.id, 5)
      .then((history) => {
        if (history && history.length > 0) {
          const userHistoryPrompts: QuickPrompt[] = history.map((item, index) => ({
            id: item.id || `hist-${index}`,
            icon: '🔍',
            title: 'Lịch sử tìm kiếm',
            prompt: item.query_text,
          }));
          setPrompts([...userHistoryPrompts, ...DEFAULT_SEARCH_PROMPTS]);
        }
      })
      .catch(() => {
        // Fallback to default search templates
      });
  }, [user]);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Gợi ý câu hỏi thông minh:</Text>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        data={prompts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.chip}
            onPress={() => onSelectPrompt(item.prompt)}
          >
            <Text style={styles.icon}>{item.icon}</Text>
            <View>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {item.prompt}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  header: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    paddingHorizontal: 14,
  },
  scroll: {
    paddingHorizontal: 12,
    gap: 8,
  },
  chip: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 240,
  },
  icon: {
    fontSize: 18,
    marginRight: 8,
  },
  title: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 11,
    maxWidth: 170,
  },
});
