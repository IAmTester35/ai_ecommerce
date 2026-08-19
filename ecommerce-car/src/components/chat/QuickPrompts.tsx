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
    title: 'Xe Thể Thao',
    prompt: 'Tìm xe thể thao động cơ mạnh mẽ, phong cách sang trọng dưới 3 tỷ',
  },
  {
    id: '2',
    iconName: 'car-sport-outline',
    title: 'SUV 7 Chỗ',
    prompt: 'Tìm xe SUV 7 chỗ gầm cao, an toàn tốt, cách âm êm trong tầm giá 2 tỷ',
  },
  {
    id: '3',
    iconName: 'flash-outline',
    title: 'Xe Điện EV',
    prompt: 'Đề xuất xe điện pin trên 450km/lần sạc, hỗ trợ lái tự động ADAS',
  },
  {
    id: '4',
    iconName: 'briefcase-outline',
    title: 'Sedan Hạng Sang',
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
      <Text style={styles.header}>Gợi ý nhanh:</Text>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        data={prompts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.75}
            style={styles.chip}
            onPress={() => onSelectPrompt(item.prompt)}
          >
            <View style={styles.iconCircle}>
              <Ionicons name={item.iconName} size={12} color={colors.primaryHover} />
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
    marginVertical: spacing.xs,
  },
  header: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: typography.weights.medium,
    marginBottom: 6,
    paddingHorizontal: spacing.lg,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xs + 2,
  },
  chip: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 220,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
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
    fontSize: 11,
    fontWeight: typography.weights.semibold,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 14,
    marginTop: 1,
  },
});

