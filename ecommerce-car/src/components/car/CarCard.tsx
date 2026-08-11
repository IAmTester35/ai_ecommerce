import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '../../theme/colors';
import { CarResponse } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface CarCardProps {
  car: CarResponse;
  onPressDetails?: (carId: string) => void;
  onPressCompare?: (car: CarResponse) => void;
  compact?: boolean;
}

export const CarCard: React.FC<CarCardProps> = ({
  car,
  onPressDetails,
  onPressCompare,
  compact = false,
}) => {
  const formatPrice = (price?: number) => {
    if (!price) return 'Liên hệ';
    if (price >= 1_000_000_000) {
      return `${(price / 1_000_000_000).toFixed(2)} tỷ VNĐ`;
    }
    return `${(price / 1_000_000).toFixed(0)} triệu VNĐ`;
  };

  const matchScore = Math.round(((car.rerank_score || car.similarity || 0.85) * 100));

  const fallbackImage = 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=800';

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: car.image_url || fallbackImage }}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.badgeContainer}>
          <Badge
            label={`AI Match: ${matchScore}%`}
            variant={matchScore > 80 ? 'primary' : 'secondary'}
            size="sm"
          />
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.carName} numberOfLines={1}>
          {car.make} {car.model} {car.year ? `(${car.year})` : ''}
        </Text>

        <Text style={styles.price}>{formatPrice(car.price)}</Text>

        <View style={styles.specRow}>
          {car.engine_hp && (
            <Text style={styles.specItem}>⚡ {car.engine_hp} HP</Text>
          )}
          {car.metadata?.transmission && (
            <Text style={styles.specItem}>⚙️ {car.metadata.transmission}</Text>
          )}
          {car.metadata?.fuel_type && (
            <Text style={styles.specItem}>⛽ {car.metadata.fuel_type}</Text>
          )}
        </View>

        {car.review && (
          <Text style={styles.reviewSnippet} numberOfLines={2}>
            &quot;{car.review}&quot;
          </Text>
        )}

        <View style={styles.actionRow}>
          {onPressDetails && (
            <Button
              title="Chi tiết"
              variant="outline"
              style={styles.btnFlex}
              onPress={() => onPressDetails(car.id)}
            />
          )}
          {onPressCompare && (
            <Button
              title="So sánh"
              variant="secondary"
              style={styles.btnFlex}
              onPress={() => onPressCompare(car)}
            />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
    marginBottom: 14,
    width: '100%',
  },
  cardCompact: {
    width: 260,
    marginRight: 12,
    marginBottom: 0,
  },
  imageContainer: {
    height: 140,
    width: '100%',
    backgroundColor: colors.surfaceElevated,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badgeContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  content: {
    padding: 14,
  },
  carName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  price: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 8,
  },
  specRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  specItem: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  reviewSnippet: {
    color: colors.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 12,
    lineHeight: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  btnFlex: {
    flex: 1,
    height: 38,
  },
});
