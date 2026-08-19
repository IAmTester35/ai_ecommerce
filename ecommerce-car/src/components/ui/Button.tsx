import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { colors, radii, spacing, typography } from '../../theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'conflict';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
  icon,
  iconRight,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          bg: colors.primary,
          text: '#FFFFFF',
          border: 'transparent',
          borderWidth: 0,
        };
      case 'secondary':
        return {
          bg: colors.surfaceElevated,
          text: colors.text,
          border: 'rgba(255, 255, 255, 0.08)',
          borderWidth: 1,
        };
      case 'outline':
        return {
          bg: 'rgba(37, 99, 235, 0.08)',
          text: colors.primaryHover,
          border: 'rgba(59, 130, 246, 0.25)',
          borderWidth: 1,
        };
      case 'ghost':
        return {
          bg: 'transparent',
          text: colors.textSecondary,
          border: 'transparent',
          borderWidth: 0,
        };
      case 'danger':
        return {
          bg: colors.dangerMuted,
          text: colors.danger,
          border: 'rgba(239, 68, 68, 0.25)',
          borderWidth: 1,
        };
      case 'conflict':
        return {
          bg: colors.conflictMuted,
          text: colors.conflict,
          border: 'rgba(245, 158, 11, 0.25)',
          borderWidth: 1,
        };
      default:
        return {
          bg: colors.surfaceElevated,
          text: colors.text,
          border: 'transparent',
          borderWidth: 0,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          height: 34,
          paddingHorizontal: spacing.md,
          fontSize: typography.sizes.xs,
          borderRadius: radii.sm,
        };
      case 'lg':
        return {
          height: 48,
          paddingHorizontal: spacing.xl,
          fontSize: typography.sizes.sm + 1,
          borderRadius: radii.md,
        };
      case 'md':
      default:
        return {
          height: 40,
          paddingHorizontal: spacing.lg,
          fontSize: typography.sizes.sm,
          borderRadius: radii.md,
        };
    }
  };

  const currentVariant = getVariantStyles();
  const currentSize = getSizeStyles();

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          backgroundColor: currentVariant.bg,
          borderColor: currentVariant.border,
          borderWidth: currentVariant.borderWidth,
          height: currentSize.height,
          paddingHorizontal: currentSize.paddingHorizontal,
          borderRadius: currentSize.borderRadius,
        },
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={currentVariant.text} size="small" />
      ) : (
        <View style={styles.contentRow}>
          {icon && <View style={styles.iconLeft}>{icon}</View>}
          <Text
            style={[
              styles.text,
              {
                color: currentVariant.text,
                fontSize: currentSize.fontSize,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
          {iconRight && <View style={styles.iconRight}>{iconRight}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: typography.weights.semibold,
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  iconLeft: {
    marginRight: 6,
  },
  iconRight: {
    marginLeft: 6,
  },
  disabled: {
    opacity: 0.45,
  },
});

