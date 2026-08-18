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
  padding = spacing.lg,
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
          borderColor: 'rgba(255, 255, 255, 0.1)',
        };
      case 'conflict':
        return {
          backgroundColor: 'rgba(255, 179, 0, 0.05)',
          borderColor: 'rgba(255, 179, 0, 0.4)',
        };
      case 'highlight':
        return {
          backgroundColor: 'rgba(0, 229, 255, 0.04)',
          borderColor: colors.primary,
        };
      case 'default':
      default:
        return {
          backgroundColor: colors.cardBg,
          borderColor: colors.cardBorder,
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
    borderWidth: 1,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.35)',
  },
  highlight: {
    borderColor: colors.primary,
  },
});
