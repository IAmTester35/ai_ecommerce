import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
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
          <Text style={styles.avatarText}>AI</Text>
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
            <Text style={styles.suggestedTitle}>🚘 Mẫu xe phù hợp nhất từ Showroom:</Text>
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
    marginVertical: 6,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: typography.weights.extrabold,
  },
  bubble: {
    maxWidth: '85%',
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - 2,
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
    fontSize: typography.sizes.base,
    lineHeight: 20,
  },
  textUser: {
    color: colors.textDark,
    fontWeight: typography.weights.semibold,
  },
  textAssistant: {
    color: colors.text,
  },
  generativeUiContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  suggestedTitle: {
    color: colors.primary,
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xs + 2,
  },
  carCarousel: {
    marginTop: 4,
  },
});
