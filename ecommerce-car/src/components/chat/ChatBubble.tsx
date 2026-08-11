import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { colors } from '../../theme/colors';
import { UIChatMessage } from '../../types/ui';
import { CarResponse } from '../../types';
import { ConflictBanner } from './ConflictBanner';
import { CarCard } from '../car/CarCard';

interface ChatBubbleProps {
  message: UIChatMessage;
  onPressCarDetails?: (carId: string) => void;
  onPressCarCompare?: (car: CarResponse) => void;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  onPressCarDetails,
  onPressCarCompare,
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
            <Text style={styles.suggestedTitle}>🚘 Xe đề xuất cho bạn:</Text>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={message.suggestedCars}
              keyExtractor={(car) => car.id}
              style={styles.carCarousel}
              renderItem={({ item }) => (
                <CarCard
                  car={item}
                  compact
                  onPressDetails={onPressCarDetails}
                  onPressCompare={onPressCarCompare}
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
    paddingHorizontal: 12,
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
    fontWeight: '800',
  },
  bubble: {
    maxWidth: '85%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  bubbleUser: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
  },
  textUser: {
    color: '#000',
    fontWeight: '600',
  },
  textAssistant: {
    color: colors.text,
  },
  generativeUiContainer: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  suggestedTitle: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  carCarousel: {
    marginTop: 4,
  },
});
