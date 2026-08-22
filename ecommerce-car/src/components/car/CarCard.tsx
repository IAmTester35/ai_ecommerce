import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '../../theme';
import { Car, CarResponse } from '../../types';
import { Badge } from '../ui/Badge';
import { formatVndPrice } from '../ui/PriceTag';
import { DepositButton } from './DepositButton';
import { FALLBACK_CAR_URL } from '../../constants/images';

export type CarCardLayout = 'grid' | 'list' | 'compact';

interface CarCardProps {
  car: Car | CarResponse;
  onPressDetails?: (carId: string) => void;
  onPressCompare?: (car: any) => void;
  onPressAddToCart?: (carId: string) => void;
  onPressToggleSave?: (carId: string) => void;
  isSaved?: boolean;
  layout?: CarCardLayout;
  style?: ViewStyle;
}

export const CarCard: React.FC<CarCardProps> = ({
  car,
  onPressDetails,
  onPressCompare,
  onPressAddToCart,
  onPressToggleSave,
  isSaved = false,
  layout = 'grid',
  style,
}) => {
  const carSearch = car as CarResponse;
  const hasMatchScore = typeof carSearch.rerank_score === 'number' || typeof carSearch.similarity === 'number';
  const matchScore = hasMatchScore
    ? Math.round((carSearch.rerank_score || carSearch.similarity || 0) * 100)
    : null;

  const fallbackImage = FALLBACK_CAR_URL;
  const carSpec = {
    engineHp: car.engine_hp,
    fuelType: car.metadata?.engine_fuel_type || car.metadata?.fuel_type,
  };

  // Build a clean specs string
  const specItems: string[] = [];
  if (car.engine_hp) specItems.push(`${car.engine_hp} HP`);
  if (car.metadata?.fuel_type) specItems.push(car.metadata.fuel_type.split(' ')[0]);
  if (car.metadata?.transmission) specItems.push(car.metadata.transmission.split(' ')[0]);

  // List layout
  if (layout === 'list') {
    return (
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={() => onPressDetails?.(car.id)}
        style={[styles.listCard, style]}
      >
        <View style={styles.listImageContainer}>
          <Image
            source={{ uri: car.image_url || fallbackImage }}
            style={styles.listImage}
            contentFit="cover"
            transition={200}
          />
          {hasMatchScore && matchScore !== null && (
            <View style={styles.badgeTopLeft}>
              <Badge
                label={`${matchScore}% Match`}
                variant={matchScore >= 90 ? 'primary' : 'secondary'}
                size="xs"
              />
            </View>
          )}
        </View>

        <View style={styles.listContent}>
          <View style={styles.listHeaderRow}>
            <Text style={styles.carName} numberOfLines={1}>
              {car.make} {car.model}
            </Text>
            {onPressToggleSave && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => onPressToggleSave(car.id)}
                style={styles.heartBtn}
              >
                <Ionicons
                  name={isSaved ? 'bookmark' : 'bookmark-outline'}
                  size={15}
                  color={isSaved ? colors.primaryHover : colors.textMuted}
                />
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.yearSub}>
            Năm {car.year || 2024} • {car.metadata?.body_type || 'Xe mới'}
          </Text>

          <Text style={styles.price}>{formatVndPrice(car.price, 'usd', carSpec)}</Text>

          {specItems.length > 0 && (
            <Text style={styles.specInline} numberOfLines={1}>
              {specItems.join(' • ')}
            </Text>
          )}

          <View style={styles.listActions}>
            <DepositButton carId={car.id} variant="mini" size="sm" />
            {onPressCompare && (
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.miniOutlineBtn}
                onPress={() => onPressCompare(car)}
              >
                <Ionicons name="git-compare-outline" size={13} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Compact or Full Grid layout
  const isCompact = layout === 'compact';

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onPressDetails?.(car.id)}
      style={[
        styles.card,
        isCompact && styles.cardCompact,
        style,
      ]}
    >
      <View style={[styles.imageContainer, isCompact && styles.imageContainerCompact]}>
        <Image
          source={{ uri: car.image_url || fallbackImage }}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />

        {hasMatchScore && matchScore !== null && (
          <View style={styles.badgeTopLeft}>
            <Badge
              label={`${matchScore}% Match`}
              variant={matchScore >= 90 ? 'primary' : 'secondary'}
              size="xs"
            />
          </View>
        )}

        {onPressToggleSave && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onPressToggleSave(car.id)}
            style={styles.saveBadgeTopRight}
          >
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={14}
              color={isSaved ? colors.primaryHover : colors.text}
            />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.carName} numberOfLines={1}>
            {car.make} {car.model}
          </Text>
        </View>

        <Text style={styles.yearSub}>
          Năm {car.year || 2024} • {car.metadata?.body_type || 'Xe mới'}
        </Text>

        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatVndPrice(car.price, 'usd', carSpec)}</Text>
          {car.stock_quantity !== undefined && car.stock_quantity > 0 && (
            <Badge label={`Sẵn ${car.stock_quantity}`} variant="neutral" size="xs" />
          )}
        </View>

        {specItems.length > 0 && (
          <View style={styles.specsRow}>
            {specItems.map((spec, index) => (
              <View key={spec + index} style={styles.specChip}>
                <Text style={styles.specChipText}>{spec}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Action bar only in regular full-width grid if actions provided */}
        {(onPressAddToCart || onPressCompare) && !isCompact && (
          <View style={styles.quickActionRow}>
            <DepositButton carId={car.id} variant="pill" size="sm" />
            {onPressCompare && (
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.actionPillOutline}
                onPress={() => onPressCompare(car)}
              >
                <Ionicons name="git-compare-outline" size={11} color={colors.textSecondary} />
                <Text style={styles.actionPillOutlineText}>So sánh</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: radii.md,
    overflow: 'hidden',
    marginBottom: spacing.md,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  cardCompact: {
    width: 230,
    marginRight: spacing.md,
    marginBottom: 0,
  },
  imageContainer: {
    height: 145,
    width: '100%',
    backgroundColor: colors.surfaceElevated,
    position: 'relative',
  },
  imageContainerCompact: {
    height: 125,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badgeTopLeft: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
  saveBadgeTopRight: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: radii.full,
    backgroundColor: 'rgba(11, 13, 17, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  content: {
    padding: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  carName: {
    color: colors.text,
    fontSize: typography.sizes.sm + 0.5,
    fontWeight: typography.weights.semibold,
    lineHeight: 18,
    flex: 1,
  },
  yearSub: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 3,
  },
  price: {
    color: colors.primaryHover,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    letterSpacing: -0.2,
  },
  specsRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  specChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.xs,
  },
  specChipText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: typography.weights.medium,
  },
  quickActionRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  actionPillPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 6,
    borderRadius: radii.sm,
    gap: 4,
  },
  actionPillPrimaryText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: typography.weights.semibold,
  },
  actionPillOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingVertical: 6,
    borderRadius: radii.sm,
    gap: 4,
  },
  actionPillOutlineText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: typography.weights.medium,
  },

  // List View
  listCard: {
    flexDirection: 'row',
    backgroundColor: colors.cardBg,
    borderRadius: radii.md,
    overflow: 'hidden',
    marginBottom: spacing.sm + 2,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  listImageContainer: {
    width: 105,
    height: 95,
    borderRadius: radii.sm,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.surfaceElevated,
  },
  listImage: {
    width: '100%',
    height: '100%',
  },
  listContent: {
    flex: 1,
    marginLeft: spacing.sm + 2,
    justifyContent: 'space-between',
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heartBtn: {
    padding: 2,
  },
  specInline: {
    color: colors.textMuted,
    fontSize: 10,
    marginVertical: 2,
  },
  listActions: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: 4,
  },
  miniActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.xs,
    gap: 3,
  },
  miniActionText: {
    color: colors.primaryHover,
    fontSize: 10,
    fontWeight: typography.weights.semibold,
  },
  miniOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.xs,
    gap: 3,
  },
  miniOutlineText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: typography.weights.medium,
  },
});

