import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  iconName?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  actionText = 'Xem tất cả',
  onAction,
  icon,
  iconName,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.titleGroup}>
        <View style={styles.titleRow}>
          {iconName && (
            <Ionicons
              name={iconName}
              size={15}
              color={colors.primaryHover}
              style={styles.iconBox}
            />
          )}
          {icon && <View style={styles.iconBox}>{icon}</View>}
          <Text style={styles.title}>{title}</Text>
        </View>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      {onAction && (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onAction}
          style={styles.actionBtn}
        >
          <Text style={styles.actionText}>{actionText}</Text>
          <Ionicons name="chevron-forward" size={12} color={colors.primaryHover} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: spacing.xl,
    marginBottom: spacing.xs,
  },
  titleGroup: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    marginRight: 6,
  },
  title: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    lineHeight: 20,
    letterSpacing: -0.1,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes['2xs'],
    lineHeight: 15,
    marginTop: 2,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingLeft: spacing.sm,
  },
  actionText: {
    color: colors.primaryHover,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    marginRight: 2,
  },
});

