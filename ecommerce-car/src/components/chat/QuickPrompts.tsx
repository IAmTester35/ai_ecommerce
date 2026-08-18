import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '../../theme';
import { historyService } from '../../services/historyService';
import { useAuthStore } from '../../store/useAuthStore';

interface PromptItem {
  id: string;
  iconName: keyof typeof Ionicons.glyphMap;
  title: string;
  prompt: string;
}

interface QuickPromptsProps {
  onSelectPrompt: (promptText: string) => void;
}

const DEFAULT_SEARCH_PROMPTS: PromptItem[] = [
  {
    id: '1',
    iconName: 'speedometer-outline',
    title: 'Động cơ V12 & Thể thao',
    prompt: 'Tìm xe thể thao động cơ mạnh mẽ, phong cách sang trọng dưới 3 tỷ',
  },
  {
    id: '2',
    iconName: 'car-sport-outline',
    title: 'SUV Gia đình 7 chỗ',
    prompt: 'Tìm xe SUV 7 chỗ gầm cao, an toàn tốt, cách âm êm trong tầm giá 2 tỷ',
  },
  {
    id: '3',
    iconName: 'flash-outline',
    title: 'Xe Điện Thông Minh',
    prompt: 'Đề xuất xe điện pin trên 450km/lần sạc, hỗ trợ lái tự động ADAS',
  },
  {
    id: '4',
    iconName: 'briefcase-outline',
    title: 'Sedan Doanh Nhân',
    prompt: 'Tư vấn xe Sedan hạng sang êm ái cho doanh nhân tầm giá 2.5 tỷ',
  },
];

export const QuickPrompts: React.FC<QuickPromptsProps> = ({ onSelectPrompt }) => {
  const { user } = useAuthStore();
  const [prompts, setPrompts] = useState<PromptItem[]>(DEFAULT_SEARCH_PROMPTS);

  useEffect(() => {
    if (!user) return;
    historyService
      .getSearchHistory(user.id, 5)
      .then((history) => {
        if (history && history.length > 0) {
          const userHistoryPrompts: PromptItem[] = history.map((item, index) => ({
            id: item.id || `hist-${index}`,
            iconName: 'search-outline',
            title: 'Lịch sử tìm kiếm',
            prompt: item.query_text,
          }));
          setPrompts([...userHistoryPrompts, ...DEFAULT_SEARCH_PROMPTS]);
        }
      })
      .catch(() => {
        // Fallback to default
      });
  }, [user]);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Gợi ý câu hỏi:</Text>
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
            <View style={styles.iconCircle}>
              <Ionicons name={item.iconName} size={14} color={colors.primaryHover} />
            </View>
            <View style={styles.textContainer}>
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
    marginVertical: 6,
  },
  header: {
    color: colors.textSecondary,
    fontSize: typography.sizes['2xs'] + 1,
    fontWeight: typography.weights.medium,
    marginBottom: 6,
    paddingHorizontal: spacing.md,
  },
  scroll: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs + 2,
  },
  chip: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 220,
  },
  iconCircle: {
    width: 26,
    height: 26,
    borderRadius: radii.full,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: colors.primaryHover,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.sizes['2xs'],
    marginTop: 1,
  },
});

