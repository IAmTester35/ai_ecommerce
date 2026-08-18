import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography, shadows } from '../../theme';
import { UIChatMessage } from '../../types/ui';
import { CarResponse } from '../../types';
import { ConflictBanner } from './ConflictBanner';
import { CarCard } from '../car/CarCard';

interface ChatBubbleProps {
  message: UIChatMessage;
  onPressCarDetails?: (carId: string) => void;
  onPressCarCompare?: (car: CarResponse) => void;
  onPressAddToCart?: (carId: string) => void;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  onPressCarDetails,
  onPressCarCompare,
  onPressAddToCart,
}) => {
  const isUser = message.role === 'user';

  return (
    <View style={[styles.wrapper, isUser ? styles.wrapperUser : styles.wrapperAssistant]}>
      {!isUser && (
        <View style={styles.avatar}>
          <Ionicons name="sparkles" size={14} color="#FFFFFF" />
        </View>
      )}

      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        {message.conflictDetected && (
          <ConflictBanner relaxedTerms={message.relaxedTerms} />
        )}

        <Text style={[styles.text, isUser ? styles.textUser : styles.textAssistant]}>
          {message.content}
        </Text>

        {message.suggestedCars && message.suggestedCars.length > 0 && (
          <View style={styles.generativeUiContainer}>
            <View style={styles.suggestedHeaderRow}>
              <Ionicons name="car-sport-outline" size={13} color={colors.primaryHover} />
              <Text style={styles.suggestedTitle}>Mẫu xe đề xuất:</Text>
            </View>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={message.suggestedCars}
              keyExtractor={(car) => car.id}
              style={styles.carCarousel}
              renderItem={({ item }) => (
                <CarCard
                  car={item}
                  layout="compact"
                  onPressDetails={onPressCarDetails}
                  onPressCompare={onPressCarCompare}
                  onPressAddToCart={onPressAddToCart}
                />
              )}
            />
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: spacing.md,
    alignItems: 'flex-start',
  },
  wrapperUser: {
    justifyContent: 'flex-end',
  },
  wrapperAssistant: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: radii.full,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    marginTop: 2,
  },
  bubble: {
    maxWidth: '85%',
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.sm,
  },
  bubbleUser: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: radii.xs,
  },
  bubbleAssistant: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderBottomLeftRadius: radii.xs,
  },
  text: {
    fontSize: typography.sizes.sm,
    lineHeight: 18,
  },
  textUser: {
    color: '#FFFFFF',
    fontWeight: typography.weights.medium,
  },
  textAssistant: {
    color: colors.text,
  },
  generativeUiContainer: {
    marginTop: spacing.sm,
    paddingTop: spacing.xs + 2,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  suggestedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  suggestedTitle: {
    color: colors.primaryHover,
    fontSize: typography.sizes['2xs'] + 1,
    fontWeight: typography.weights.semibold,
  },
  carCarousel: {
    marginTop: 4,
  },
});

