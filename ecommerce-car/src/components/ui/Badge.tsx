import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'conflict' | 'success' | 'outline';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'primary', size = 'sm' }) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return { bg: colors.primaryMuted, text: colors.primary, border: colors.primary };
      case 'secondary':
        return { bg: 'rgba(124, 77, 255, 0.15)', text: colors.secondary, border: colors.secondary };
      case 'conflict':
        return { bg: colors.conflictMuted, text: colors.conflict, border: colors.conflict };
      case 'success':
        return { bg: 'rgba(0, 230, 118, 0.15)', text: colors.success, border: colors.success };
      default:
        return { bg: colors.surfaceElevated, text: colors.textSecondary, border: colors.border };
    }
  };

  const styleConfig = getVariantStyles();

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: styleConfig.bg, borderColor: styleConfig.border },
        size === 'md' && styles.badgeMd,
      ]}
    >
      <Text style={[styles.text, { color: styleConfig.text }, size === 'md' && styles.textMd]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeMd: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
  textMd: {
    fontSize: 13,
  },
});
