import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme';

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: number;
  showScore?: boolean;
  scoreText?: string;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  style?: ViewStyle;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  maxRating = 5,
  size = 14,
  showScore = false,
  scoreText,
  interactive = false,
  onRatingChange,
  style,
}) => {
  const stars = [];

  for (let i = 1; i <= maxRating; i++) {
    const isFull = rating >= i;
    const isHalf = !isFull && rating >= i - 0.5;

    const starIcon = (
      <Ionicons
        key={i}
        name={isFull ? 'star' : isHalf ? 'star-half' : 'star-outline'}
        size={size}
        color={colors.conflict}
        style={styles.star}
      />
    );

    if (interactive) {
      stars.push(
        <TouchableOpacity
          key={i}
          activeOpacity={0.7}
          onPress={() => onRatingChange?.(i)}
        >
          {starIcon}
        </TouchableOpacity>
      );
    } else {
      stars.push(starIcon);
    }
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.starsRow}>{stars}</View>
      {showScore && (
        <Text style={[styles.scoreText, { fontSize: size - 2 }]}>
          {scoreText || `${rating.toFixed(1)}/5`}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    marginRight: 3,
  },
  scoreText: {
    color: colors.conflict,
    fontWeight: typography.weights.semibold,
    marginLeft: spacing.sm,
  },
});
