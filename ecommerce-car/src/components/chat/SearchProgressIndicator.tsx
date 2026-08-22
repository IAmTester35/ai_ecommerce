import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '../../theme';
import { SearchProgressEvent } from '../../types';

interface SearchProgressIndicatorProps {
  progress?: SearchProgressEvent;
  isStreaming?: boolean;
}

const STAGES = [
  { key: 'analyzing', step: 1, label: 'Phân tích' },
  { key: 'searching', step: 2, label: 'Kho xe' },
  { key: 'enriching', step: 3, label: 'Hình ảnh' },
  { key: 'generating', step: 4, label: 'Tư vấn AI' },
];

export const SearchProgressIndicator: React.FC<SearchProgressIndicatorProps> = ({
  progress,
  isStreaming,
}) => {
  if (!progress && !isStreaming) return null;

  const currentStep = progress?.step || 1;
  const isCompleted = progress?.stage === 'completed' || (!isStreaming && currentStep >= 4);

  return (
    <View style={[styles.card, isCompleted && styles.cardCompleted]}>
      {/* Header with step progress and status */}
      <View style={styles.header}>
        <View style={styles.stageTitleRow}>
          {isCompleted ? (
            <Ionicons name="checkmark-circle" size={14} color={colors.success} />
          ) : (
            <ActivityIndicator size="small" color={colors.primaryHover} style={{ transform: [{ scale: 0.7 }] }} />
          )}
          <Text style={styles.stageLabel}>
            {progress?.label || (isCompleted ? 'Đã hoàn tất tìm kiếm' : 'Đang xử lý yêu cầu...')}
          </Text>
        </View>
        <Text style={styles.stepCounter}>
          {isCompleted ? '100%' : `Bước ${Math.min(currentStep, 4)}/4`}
        </Text>
      </View>

      {/* Detail text if present and not finished */}
      {!isCompleted && progress?.detail && (
        <Text style={styles.detailText} numberOfLines={1}>
          {progress.detail}
        </Text>
      )}

      {/* Multi-step progress bar */}
      <View style={styles.stepperContainer}>
        {STAGES.map((s, idx) => {
          const stepDone = isCompleted || currentStep > s.step;
          const stepActive = !isCompleted && currentStep === s.step;

          return (
            <View key={s.key} style={styles.stepItem}>
              <View
                style={[
                  styles.stepBar,
                  stepDone && styles.stepBarDone,
                  stepActive && styles.stepBarActive,
                ]}
              />
              <Text
                style={[
                  styles.stepItemText,
                  stepDone && styles.stepItemTextDone,
                  stepActive && styles.stepItemTextActive,
                ]}
              >
                {s.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    marginBottom: spacing.xs + 2,
  },
  cardCompleted: {
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    borderColor: 'rgba(34, 197, 94, 0.2)',
    paddingVertical: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stageTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  stageLabel: {
    color: '#F3F4F6',
    fontSize: 11,
    fontWeight: typography.weights.semibold,
    letterSpacing: 0.1,
  },
  stepCounter: {
    color: colors.primaryHover,
    fontSize: 10,
    fontWeight: typography.weights.bold,
  },
  detailText: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 2,
    fontStyle: 'italic',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 5,
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
  },
  stepBar: {
    width: '100%',
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 2,
  },
  stepBarActive: {
    backgroundColor: colors.primaryHover,
  },
  stepBarDone: {
    backgroundColor: colors.success,
  },
  stepItemText: {
    fontSize: 8,
    color: colors.textMuted,
    fontWeight: typography.weights.medium,
  },
  stepItemTextActive: {
    color: colors.primaryHover,
    fontWeight: typography.weights.bold,
  },
  stepItemTextDone: {
    color: colors.success,
    fontWeight: typography.weights.medium,
  },
});
