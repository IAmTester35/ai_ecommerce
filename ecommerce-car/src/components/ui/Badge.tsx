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
          border: 'rgba(59, 130, 246, 0.20)',
          dotColor: colors.primaryHover,
        };
      case 'secondary':
        return {
          bg: colors.secondaryMuted,
          text: colors.secondaryHover,
          border: 'rgba(99, 102, 241, 0.20)',
          dotColor: colors.secondaryHover,
        };
      case 'conflict':
      case 'warning':
        return {
          bg: colors.conflictMuted,
          text: colors.conflict,
          border: 'rgba(245, 158, 11, 0.20)',
          dotColor: colors.conflict,
        };
      case 'success':
        return {
          bg: colors.successMuted,
          text: colors.success,
          border: 'rgba(16, 185, 129, 0.20)',
          dotColor: colors.success,
        };
      case 'danger':
        return {
          bg: colors.dangerMuted,
          text: colors.danger,
          border: 'rgba(239, 68, 68, 0.20)',
          dotColor: colors.danger,
        };
      case 'gold':
        return {
          bg: 'rgba(245, 158, 11, 0.12)',
          text: '#FBBF24',
          border: 'rgba(245, 158, 11, 0.25)',
          dotColor: '#FBBF24',
        };
      case 'outline':
        return {
          bg: 'rgba(255, 255, 255, 0.04)',
          text: colors.textSecondary,
          border: 'rgba(255, 255, 255, 0.08)',
          dotColor: colors.textSecondary,
        };
      case 'neutral':
      default:
        return {
          bg: colors.surfaceElevated,
          text: colors.textSecondary,
          border: 'rgba(255, 255, 255, 0.06)',
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
          borderRadius: radii.full,
          dotSize: 4,
        };
      case 'md':
        return {
          paddingHorizontal: 10,
          paddingVertical: 4,
          fontSize: typography.sizes.xs,
          borderRadius: radii.full,
          dotSize: 5,
        };
      case 'sm':
      default:
        return {
          paddingHorizontal: 8,
          paddingVertical: 2.5,
          fontSize: typography.sizes['2xs'],
          borderRadius: radii.full,
          dotSize: 4.5,
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
          paddingHorizontal: sizeConfig.paddingHorizontal,
          paddingVertical: sizeConfig.paddingVertical,
          borderRadius: sizeConfig.borderRadius,
          borderColor: styleConfig.border,
          borderWidth: 0.5,
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
    letterSpacing: 0.15,
  },
});

