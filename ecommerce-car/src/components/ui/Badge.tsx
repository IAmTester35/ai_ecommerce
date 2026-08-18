import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, radii, spacing, typography } from '../../theme';

export type BadgeVariant =
  | 'primary'
  | 'secondary'
  | 'conflict'
  | 'warning'
  | 'success'
  | 'danger'
  | 'outline'
  | 'neutral'
  | 'gold';

export type BadgeSize = 'xs' | 'sm' | 'md';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  size = 'sm',
  icon,
  style,
  textStyle,
  dot = false,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          bg: colors.primaryMuted,
          text: colors.primaryHover,
          border: 'rgba(59, 130, 246, 0.25)',
          dotColor: colors.primary,
        };
      case 'secondary':
        return {
          bg: colors.secondaryMuted,
          text: colors.secondaryHover,
          border: 'rgba(99, 102, 241, 0.25)',
          dotColor: colors.secondary,
        };
      case 'conflict':
      case 'warning':
        return {
          bg: colors.conflictMuted,
          text: colors.conflict,
          border: 'rgba(245, 158, 11, 0.25)',
          dotColor: colors.conflict,
        };
      case 'success':
        return {
          bg: colors.successMuted,
          text: colors.success,
          border: 'rgba(16, 185, 129, 0.25)',
          dotColor: colors.success,
        };
      case 'danger':
        return {
          bg: colors.dangerMuted,
          text: colors.danger,
          border: 'rgba(239, 68, 68, 0.25)',
          dotColor: colors.danger,
        };
      case 'gold':
        return {
          bg: 'rgba(245, 158, 11, 0.12)',
          text: '#FBBF24',
          border: 'rgba(245, 158, 11, 0.30)',
          dotColor: '#FBBF24',
        };
      case 'outline':
        return {
          bg: 'transparent',
          text: colors.textSecondary,
          border: colors.border,
          dotColor: colors.textSecondary,
        };
      case 'neutral':
      default:
        return {
          bg: colors.surfaceElevated,
          text: colors.textSecondary,
          border: colors.border,
          dotColor: colors.textSecondary,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'xs':
        return {
          paddingHorizontal: 5,
          paddingVertical: 2,
          fontSize: 10,
          borderRadius: radii.xs,
          dotSize: 4,
        };
      case 'md':
        return {
          paddingHorizontal: spacing.sm + 2,
          paddingVertical: 4,
          fontSize: typography.sizes.sm,
          borderRadius: radii.sm,
          dotSize: 5,
        };
      case 'sm':
      default:
        return {
          paddingHorizontal: 7,
          paddingVertical: 3,
          fontSize: typography.sizes.xs,
          borderRadius: radii.xs + 1,
          dotSize: 4,
        };
    }
  };

  const styleConfig = getVariantStyles();
  const sizeConfig = getSizeStyles();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: styleConfig.bg,
          borderColor: styleConfig.border,
          paddingHorizontal: sizeConfig.paddingHorizontal,
          paddingVertical: sizeConfig.paddingVertical,
          borderRadius: sizeConfig.borderRadius,
        },
        style,
      ]}
    >
      {dot && (
        <View
          style={[
            styles.dot,
            {
              backgroundColor: styleConfig.dotColor,
              width: sizeConfig.dotSize,
              height: sizeConfig.dotSize,
              borderRadius: sizeConfig.dotSize / 2,
            },
          ]}
        />
      )}
      {icon && <View style={styles.iconBox}>{icon}</View>}
      <Text
        style={[
          styles.text,
          {
            color: styleConfig.text,
            fontSize: sizeConfig.fontSize,
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    marginRight: 4,
  },
  iconBox: {
    marginRight: 3,
  },
  text: {
    fontWeight: typography.weights.semibold,
    letterSpacing: 0.1,
  },
});

