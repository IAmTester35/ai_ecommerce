import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity, StyleProp } from 'react-native';
import { colors, radii, spacing, shadows } from '../../theme';

export type CardVariant = 'default' | 'elevated' | 'glass' | 'highlight' | 'conflict';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: CardVariant;
  highlightBorder?: boolean;
  onPress?: () => void;
  padding?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'default',
  highlightBorder = false,
  onPress,
  padding = spacing.md,
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: colors.surfaceElevated,
          borderColor: colors.border,
          ...shadows.md,
        };
      case 'glass':
        return {
          backgroundColor: colors.surfaceGlass,
          borderColor: colors.borderLight,
        };
      case 'conflict':
        return {
          backgroundColor: colors.conflictMuted,
          borderColor: 'rgba(245, 158, 11, 0.25)',
        };
      case 'highlight':
        return {
          backgroundColor: colors.primaryMuted,
          borderColor: colors.primary,
        };
      case 'default':
      default:
        return {
          backgroundColor: colors.cardBg,
          borderColor: colors.cardBorder,
          ...shadows.sm,
        };
    }
  };

  const dynamicStyles = [
    styles.card,
    getVariantStyle(),
    highlightBorder && styles.highlight,
    { padding },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        style={dynamicStyles}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={dynamicStyles}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.md,
    borderWidth: 1,
  },
  highlight: {
    borderColor: colors.primary,
  },
});

