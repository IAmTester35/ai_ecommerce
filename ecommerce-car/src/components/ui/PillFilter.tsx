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
    paddingVertical: 4,
    gap: spacing.xs,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  pillDefault: {
    backgroundColor: colors.surfaceElevated,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  pillSelected: {
    backgroundColor: colors.primaryMuted,
    borderColor: 'rgba(59, 130, 246, 0.35)',
  },
  iconBox: {
    marginRight: 4,
  },
  label: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  labelDefault: {
    color: colors.textSecondary,
  },
  labelSelected: {
    color: colors.primaryHover,
    fontWeight: typography.weights.semibold,
  },
  countBadge: {
    marginLeft: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radii.full,
  },
  countBadgeDefault: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  countBadgeSelected: {
    backgroundColor: colors.primary,
  },
  countText: {
    fontSize: 10,
    fontWeight: typography.weights.semibold,
  },
  countTextDefault: {
    color: colors.textSecondary,
  },
  countTextSelected: {
    color: '#FFFFFF',
  },
});

