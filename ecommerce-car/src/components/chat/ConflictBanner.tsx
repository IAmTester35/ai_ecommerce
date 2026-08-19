import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '../../theme';

interface ConflictBannerProps {
  relaxedTerms?: string[];
}

export const ConflictBanner: React.FC<ConflictBannerProps> = ({ relaxedTerms }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="alert-circle-outline" size={15} color={colors.conflict} />
        <Text style={styles.title}>Cảnh báo xung đột tiêu chí</Text>
      </View>
      <Text style={styles.description}>
        Yêu cầu có tiêu chí chưa đồng nhất, AI đã tự động điều chỉnh bộ lọc để tìm mẫu xe tối ưu nhất:
      </Text>

      {relaxedTerms && relaxedTerms.length > 0 && (
        <View style={styles.termsContainer}>
          {relaxedTerms.map((term, index) => (
            <View key={index} style={styles.termBadge}>
              <Text style={styles.termText}>{term}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.conflictMuted,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  title: {
    color: colors.conflict,
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.semibold,
  },
  description: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    lineHeight: 18,
  },
  termsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
    marginTop: 8,
  },
  termBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderRadius: radii.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  termText: {
    color: colors.conflict,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
});
