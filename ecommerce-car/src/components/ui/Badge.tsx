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
          text: colors.primary,
          border: 'rgba(0, 229, 255, 0.3)',
          dotColor: colors.primary,
        };
      case 'secondary':
        return {
          bg: colors.secondaryMuted,
          text: colors.secondary,
          border: 'rgba(124, 77, 255, 0.3)',
          dotColor: colors.secondary,
        };
      case 'conflict':
      case 'warning':
        return {
          bg: colors.conflictMuted,
          text: colors.conflict,
          border: 'rgba(255, 179, 0, 0.3)',
          dotColor: colors.conflict,
        };
      case 'success':
        return {
          bg: colors.successMuted,
          text: colors.success,
          border: 'rgba(0, 230, 118, 0.3)',
          dotColor: colors.success,
        };
      case 'danger':
        return {
          bg: colors.dangerMuted,
          text: colors.danger,
          border: 'rgba(255, 82, 82, 0.3)',
          dotColor: colors.danger,
        };
      case 'gold':
        return {
          bg: 'rgba(255, 215, 0, 0.15)',
          text: '#FFD700',
          border: 'rgba(255, 215, 0, 0.35)',
          dotColor: '#FFD700',
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
          paddingHorizontal: 6,
          paddingVertical: 2,
          fontSize: 10,
          borderRadius: radii.xs,
          dotSize: 4,
        };
      case 'md':
        return {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs + 1,
          fontSize: typography.sizes.sm,
          borderRadius: radii.sm,
          dotSize: 6,
        };
      case 'sm':
      default:
        return {
          paddingHorizontal: spacing.sm,
          paddingVertical: 3,
          fontSize: typography.sizes.xs,
          borderRadius: radii.xs + 2,
          dotSize: 5,
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
    marginRight: 5,
  },
  iconBox: {
    marginRight: 4,
  },
  text: {
    fontWeight: typography.weights.bold,
    letterSpacing: 0.2,
  },
});
