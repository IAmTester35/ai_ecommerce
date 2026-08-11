import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  highlightBorder?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, style, highlightBorder = false }) => {
  return (
    <View
      style={[
        styles.card,
        highlightBorder && styles.highlight,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.3)',
  },
  highlight: {
    borderColor: colors.primary,
  },
});
