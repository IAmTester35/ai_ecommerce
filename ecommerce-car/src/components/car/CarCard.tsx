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
import { colors, radii, spacing, typography, shadows } from '../../theme';
import { Car, CarResponse } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatVndPrice } from '../ui/PriceTag';
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

  const monthlyEst =
    car.price && car.price > 0
      ? Math.round(((car.price * 0.8) / (7 * 12)) * 1.08 / 1_000_000)
      : 0;

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
                  size={16}
                  color={isSaved ? colors.primaryHover : colors.textMuted}
                />
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.yearText}>Năm {car.year || 2024}</Text>

          <Text style={styles.price}>{formatVndPrice(car.price)}</Text>

          <View style={styles.specChipsRow}>
            {car.engine_hp && (
              <View style={styles.specChipBox}>
                <Ionicons name="speedometer-outline" size={11} color={colors.textSecondary} style={{ marginRight: 3 }} />
                <Text style={styles.specChipText}>{car.engine_hp} HP</Text>
              </View>
            )}
            {car.metadata?.fuel_type && (
              <View style={styles.specChipBox}>
                <Ionicons name="water-outline" size={11} color={colors.textSecondary} style={{ marginRight: 3 }} />
                <Text style={styles.specChipText} numberOfLines={1}>
                  {car.metadata.fuel_type.split(' ')[0]}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.listActionRow}>
            {onPressAddToCart && (
              <Button
                title="Đặt cọc"
                variant="primary"
                size="sm"
                onPress={() => onPressAddToCart(car.id)}
                style={styles.actionBtnHalf}
                icon={<Ionicons name="flash-outline" size={12} color="#FFFFFF" />}
              />
            )}
            {onPressCompare && (
              <Button
                title="So sánh"
                variant="outline"
                size="sm"
                onPress={() => onPressCompare(car)}
                style={styles.actionBtnHalf}
              />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Grid / Compact layout
  const isCompact = layout === 'compact';

  return (
    <TouchableOpacity
      activeOpacity={0.88}
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
          transition={250}
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
              size={15}
              color={isSaved ? colors.primaryHover : colors.text}
            />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.carName} numberOfLines={1}>
          {car.make} {car.model}
        </Text>

        <Text style={styles.yearSub}>Năm {car.year || 2024}</Text>

        <Text style={styles.price}>{formatVndPrice(car.price)}</Text>

        {monthlyEst > 0 && (
          <View style={styles.installmentRow}>
            <Ionicons name="card-outline" size={11} color={colors.textMuted} style={{ marginRight: 4 }} />
            <Text style={styles.installmentTeaser}>
              Trả góp từ ~{monthlyEst} tr/tháng
            </Text>
          </View>
        )}

        <View style={styles.specRow}>
          {car.engine_hp && (
            <View style={styles.specPill}>
              <Ionicons name="speedometer-outline" size={11} color={colors.textSecondary} style={{ marginRight: 3 }} />
              <Text style={styles.specText}>{car.engine_hp} HP</Text>
            </View>
          )}
          {car.metadata?.fuel_type && (
            <View style={styles.specPill}>
              <Ionicons name="water-outline" size={11} color={colors.textSecondary} style={{ marginRight: 3 }} />
              <Text style={styles.specText} numberOfLines={1}>
                {car.metadata.fuel_type.split(' ')[0]}
              </Text>
            </View>
          )}
          {car.metadata?.body_type && (
            <View style={styles.specPill}>
              <Ionicons name="car-outline" size={11} color={colors.textSecondary} style={{ marginRight: 3 }} />
              <Text style={styles.specText} numberOfLines={1}>
                {car.metadata.body_type.split(' ')[0]}
              </Text>
            </View>
          )}
        </View>

        {carSearch.review && !isCompact && (
          <Text style={styles.reviewSnippet} numberOfLines={2}>
            &quot;{carSearch.review}&quot;
          </Text>
        )}

        <View style={styles.actionRow}>
          {onPressAddToCart && (
            <Button
              title="Đặt cọc"
              variant="primary"
              size="sm"
              style={styles.btnFlex}
              onPress={() => onPressAddToCart(car.id)}
              icon={<Ionicons name="flash-outline" size={12} color="#FFFFFF" />}
            />
          )}
          {onPressCompare && (
            <Button
              title="So sánh"
              variant="outline"
              size="sm"
              style={styles.btnFlex}
              onPress={() => onPressCompare(car)}
            />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
    marginBottom: spacing.md,
    width: '100%',
    ...shadows.sm,
  },
  cardCompact: {
    width: 250,
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
    top: 6,
    left: 6,
  },
  saveBadgeTopRight: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: radii.full,
    backgroundColor: 'rgba(9, 10, 12, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  content: {
    padding: spacing.sm + 2,
  },
  carName: {
    color: colors.text,
    fontSize: typography.sizes.sm + 1,
    fontWeight: typography.weights.semibold,
  },
  yearSub: {
    color: colors.textMuted,
    fontSize: typography.sizes['2xs'],
    marginTop: 1,
    marginBottom: 4,
  },
  price: {
    color: colors.primaryHover,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    letterSpacing: -0.2,
  },
  installmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: spacing.xs + 2,
  },
  installmentTeaser: {
    color: colors.textMuted,
    fontSize: typography.sizes['2xs'],
  },
  specRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
    flexWrap: 'wrap',
  },
  specPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.xs,
  },
  specText: {
    color: colors.textSecondary,
    fontSize: typography.sizes['2xs'],
    fontWeight: typography.weights.medium,
  },
  reviewSnippet: {
    color: colors.textMuted,
    fontSize: typography.sizes['2xs'],
    fontStyle: 'italic',
    marginBottom: spacing.sm,
    lineHeight: 15,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.xs + 2,
    marginTop: spacing.xs,
  },
  btnFlex: {
    flex: 1,
  },

  // List View Styles
  listCard: {
    flexDirection: 'row',
    backgroundColor: colors.cardBg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
    marginBottom: spacing.sm + 2,
    padding: spacing.sm,
    ...shadows.sm,
  },
  listImageContainer: {
    width: 110,
    height: 110,
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
  yearText: {
    color: colors.textMuted,
    fontSize: typography.sizes['2xs'],
  },
  specChipsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginVertical: 2,
  },
  specChipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: radii.xs,
  },
  specChipText: {
    color: colors.textSecondary,
    fontSize: typography.sizes['2xs'],
  },
  listActionRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: 4,
  },
  actionBtnHalf: {
    flex: 1,
  },
});

