import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '../../theme';
import { UIChatMessage } from '../../types/ui';
import { CarResponse } from '../../types';
import { ConflictBanner } from './ConflictBanner';
import { CarCard } from '../car/CarCard';

interface ChatBubbleProps {
  message: UIChatMessage;
  onPressCarDetails?: (carId: string) => void;
  onPressCarCompare?: (car: CarResponse) => void;
  onPressCompareAll?: (cars: CarResponse[]) => void;
  onPressAddToCart?: (carId: string) => void;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  onPressCarDetails,
  onPressCarCompare,
  onPressCompareAll,
  onPressAddToCart,
}) => {
  const isUser = message.role === 'user';

  return (
    <View style={[styles.wrapper, isUser ? styles.wrapperUser : styles.wrapperAssistant]}>
      {!isUser && (
        <View style={styles.avatar}>
          <Ionicons name="sparkles" size={13} color="#FFFFFF" />
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
              <Ionicons name="car-sport-outline" size={12} color={colors.primaryHover} />
              <Text style={styles.suggestedTitle}>Mẫu xe đề xuất:</Text>
            </View>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={message.suggestedCars}
              keyExtractor={(car) => car.id}
              style={styles.carCarousel}
              contentContainerStyle={{ paddingVertical: 4 }}
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

            {message.suggestedCars.length >= 2 && (
              <TouchableOpacity
                style={styles.compareAllBtn}
                activeOpacity={0.8}
                onPress={() => onPressCompareAll?.(message.suggestedCars!)}
              >
                <Ionicons name="git-compare-outline" size={13} color="#FFFFFF" />
                <Text style={styles.compareAllBtnText}>
                  So sánh {message.suggestedCars.length} mẫu xe này
                </Text>
              </TouchableOpacity>
            )}
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
    paddingHorizontal: spacing.lg,
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
    maxWidth: '88%',
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderWidth: 1,
  },
  bubbleUser: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    borderBottomRightRadius: radii.xs,
  },
  bubbleAssistant: {
    backgroundColor: colors.surfaceElevated,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderBottomLeftRadius: radii.xs,
  },
  text: {
    fontSize: typography.sizes.xs + 1,
    lineHeight: 19,
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
    paddingTop: spacing.xs,
  },
  suggestedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  suggestedTitle: {
    color: colors.primaryHover,
    fontSize: 11,
    fontWeight: typography.weights.semibold,
  },
  carCarousel: {
    marginTop: 2,
  },
  compareAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: radii.sm,
    marginTop: 8,
    alignSelf: 'flex-start',
    gap: 6,
  },
  compareAllBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: typography.weights.semibold,
  },
});

