import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity, StyleProp } from 'react-native';
import { colors, radii, spacing, shadows } from '../../theme';

export type CardVariant = 'default' | 'elevated' | 'glass' | 'highlight' | 'conflict';

interface CardProps {
  children?: React.ReactNode;
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
  padding = spacing.lg,
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: colors.surfaceElevated,
          ...shadows.md,
        };
      case 'glass':
        return {
          backgroundColor: colors.surfaceGlass,
          ...shadows.sm,
        };
      case 'conflict':
        return {
          backgroundColor: colors.conflictMuted,
          ...shadows.sm,
        };
      case 'highlight':
        return {
          backgroundColor: colors.primaryMuted,
          ...shadows.glowCyan,
        };
      case 'default':
      default:
        return {
          backgroundColor: colors.cardBg,
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
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  highlight: {
    borderWidth: 1,
    borderColor: colors.primary,
  },
});

