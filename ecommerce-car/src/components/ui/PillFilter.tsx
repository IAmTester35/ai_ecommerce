import React from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  View,
} from 'react-native';
import { colors, radii, spacing, typography } from '../../theme';

export interface PillOption<T = string> {
  id: T;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

interface PillFilterProps<T = string> {
  options: PillOption<T>[];
  selectedId: T;
  onSelect: (id: T) => void;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
}

export function PillFilter<T = string>({
  options,
  selectedId,
  onSelect,
  style,
  contentContainerStyle,
}: PillFilterProps<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.container, style]}
      contentContainerStyle={[styles.content, contentContainerStyle]}
    >
      {options.map((item) => {
        const isSelected = item.id === selectedId;

        return (
          <TouchableOpacity
            key={String(item.id)}
            activeOpacity={0.8}
            onPress={() => onSelect(item.id)}
            style={[
              styles.pill,
              isSelected ? styles.pillSelected : styles.pillDefault,
            ]}
          >
            {item.icon && <View style={styles.iconBox}>{item.icon}</View>}
            <Text
              style={[
                styles.label,
                isSelected ? styles.labelSelected : styles.labelDefault,
              ]}
            >
              {item.label}
            </Text>
            {typeof item.count === 'number' && (
              <View
                style={[
                  styles.countBadge,
                  isSelected ? styles.countBadgeSelected : styles.countBadgeDefault,
                ]}
              >
                <Text
                  style={[
                    styles.countText,
                    isSelected ? styles.countTextSelected : styles.countTextDefault,
                  ]}
                >
                  {item.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 0,
  },
  content: {
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  pillDefault: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
  },
  pillSelected: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  iconBox: {
    marginRight: 6,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  labelDefault: {
    color: colors.textSecondary,
  },
  labelSelected: {
    color: colors.primary,
  },
  countBadge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radii.full,
  },
  countBadgeDefault: {
    backgroundColor: colors.surface,
  },
  countBadgeSelected: {
    backgroundColor: colors.primary,
  },
  countText: {
    fontSize: typography.sizes['2xs'],
    fontWeight: typography.weights.bold,
  },
  countTextDefault: {
    color: colors.textMuted,
  },
  countTextSelected: {
    color: colors.textDark,
  },
});
