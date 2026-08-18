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
    borderColor: 'rgba(245, 158, 11, 0.25)',
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: spacing.sm + 2,
    marginBottom: spacing.xs + 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 3,
  },
  title: {
    color: colors.conflict,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  description: {
    color: colors.textSecondary,
    fontSize: typography.sizes['2xs'] + 1,
    lineHeight: 16,
  },
  termsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: 6,
  },
  termBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderWidth: 1,
    borderRadius: radii.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  termText: {
    color: colors.conflict,
    fontSize: typography.sizes['2xs'],
    fontWeight: typography.weights.semibold,
  },
});
