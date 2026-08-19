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
    borderRadius: radii.lg,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    width: '100%',
    ...shadows.sm,
  },
  cardCompact: {
    width: 260,
    marginRight: spacing.lg,
    marginBottom: 0,
  },
  imageContainer: {
    height: 155,
    width: '100%',
    backgroundColor: colors.surfaceElevated,
    position: 'relative',
  },
  imageContainerCompact: {
    height: 135,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badgeTopLeft: {
    position: 'absolute',
    top: 10,
    left: 10,
  },
  saveBadgeTopRight: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: radii.full,
    backgroundColor: 'rgba(9, 10, 12, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: spacing.lg,
  },
  carName: {
    color: colors.text,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    lineHeight: 20,
  },
  yearSub: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    marginTop: 2,
    marginBottom: 6,
  },
  price: {
    color: colors.primaryHover,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    letterSpacing: -0.2,
  },
  installmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: spacing.sm,
  },
  installmentTeaser: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
  },
  specRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  specPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  specText: {
    color: colors.textSecondary,
    fontSize: typography.sizes['2xs'] + 1,
    fontWeight: typography.weights.medium,
  },
  reviewSnippet: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    fontStyle: 'italic',
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  btnFlex: {
    flex: 1,
  },

  // List View Styles
  listCard: {
    flexDirection: 'row',
    backgroundColor: colors.cardBg,
    borderRadius: radii.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    padding: spacing.md,
    ...shadows.sm,
  },
  listImageContainer: {
    width: 120,
    height: 120,
    borderRadius: radii.md,
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
    marginLeft: spacing.md,
    justifyContent: 'space-between',
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heartBtn: {
    padding: 4,
  },
  yearText: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
  },
  specChipsRow: {
    flexDirection: 'row',
    gap: spacing.xs + 2,
    marginVertical: 4,
  },
  specChipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  specChipText: {
    color: colors.textSecondary,
    fontSize: typography.sizes['2xs'] + 1,
    fontWeight: typography.weights.medium,
  },
  listActionRow: {
    flexDirection: 'row',
    gap: spacing.xs + 2,
    marginTop: 6,
  },
  actionBtnHalf: {
    flex: 1,
  },
});

