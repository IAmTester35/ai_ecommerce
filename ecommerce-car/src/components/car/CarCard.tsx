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

  const fallbackImage =
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=800';

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
                  size={18}
                  color={isSaved ? colors.primary : colors.textMuted}
                />
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.yearText}>Phiên bản {car.year || 2024}</Text>

          <Text style={styles.price}>{formatVndPrice(car.price)}</Text>

          <View style={styles.specChipsRow}>
            {car.engine_hp && (
              <Text style={styles.specChip}>⚡ {car.engine_hp} HP</Text>
            )}
            {car.metadata?.transmission && (
              <Text style={styles.specChip} numberOfLines={1}>
                ⚙️ {car.metadata.transmission.split(' ')[0]}
              </Text>
            )}
          </View>

          <View style={styles.listActionRow}>
            {onPressAddToCart && (
              <Button
                title="Thêm giỏ"
                variant="outline"
                size="sm"
                onPress={() => onPressAddToCart(car.id)}
                style={styles.actionBtnHalf}
                icon={<Ionicons name="cart-outline" size={14} color={colors.primary} />}
              />
            )}
            {onPressCompare && (
              <Button
                title="So sánh"
                variant="secondary"
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
              size="sm"
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
              size={18}
              color={isSaved ? colors.primary : colors.text}
            />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.carName} numberOfLines={1}>
          {car.make} {car.model}
        </Text>

        <Text style={styles.yearSub}>Năm SX: {car.year || 2024}</Text>

        <Text style={styles.price}>{formatVndPrice(car.price)}</Text>

        {monthlyEst > 0 && (
          <Text style={styles.installmentTeaser}>
            ⚡ Trả góp từ ~{monthlyEst} tr/tháng
          </Text>
        )}

        <View style={styles.specRow}>
          {car.engine_hp && (
            <View style={styles.specPill}>
              <Text style={styles.specText}>⚡ {car.engine_hp} HP</Text>
            </View>
          )}
          {car.metadata?.fuel_type && (
            <View style={styles.specPill}>
              <Text style={styles.specText} numberOfLines={1}>
                ⛽ {car.metadata.fuel_type.split(' ')[0]}
              </Text>
            </View>
          )}
          {car.metadata?.body_type && (
            <View style={styles.specPill}>
              <Text style={styles.specText} numberOfLines={1}>
                🚘 {car.metadata.body_type.split(' ')[0]}
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
              icon={<Ionicons name="flash-outline" size={14} color={colors.textDark} />}
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
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
    marginBottom: spacing.md,
    width: '100%',
    ...shadows.md,
  },
  cardCompact: {
    width: 270,
    marginRight: spacing.md,
    marginBottom: 0,
  },
  imageContainer: {
    height: 160,
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
    top: spacing.sm,
    left: spacing.sm,
  },
  saveBadgeTopRight: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 34,
    height: 34,
    borderRadius: radii.full,
    backgroundColor: 'rgba(11, 14, 20, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  content: {
    padding: spacing.md,
  },
  carName: {
    color: colors.text,
    fontSize: typography.sizes.base + 1,
    fontWeight: typography.weights.bold,
  },
  yearSub: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    marginTop: 2,
    marginBottom: 6,
  },
  price: {
    color: colors.primary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.extrabold,
    letterSpacing: -0.3,
  },
  installmentTeaser: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    marginTop: 2,
    marginBottom: spacing.sm,
    fontWeight: typography.weights.medium,
  },
  specRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
    flexWrap: 'wrap',
  },
  specPill: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    paddingHorizontal: spacing.sm - 2,
    paddingVertical: 3,
    borderRadius: radii.xs,
  },
  specText: {
    color: colors.textSecondary,
    fontSize: typography.sizes['2xs'] + 1,
    fontWeight: typography.weights.semibold,
  },
  reviewSnippet: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    fontStyle: 'italic',
    marginBottom: spacing.md,
    lineHeight: 17,
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
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
    marginBottom: spacing.md,
    padding: spacing.sm,
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
    padding: 2,
  },
  yearText: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
  },
  specChipsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginVertical: 4,
  },
  specChip: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.xs,
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
