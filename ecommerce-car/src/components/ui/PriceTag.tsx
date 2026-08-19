import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '../../theme';

interface PriceTagProps {
  price?: number | null;
  originalPrice?: number | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showInstallment?: boolean;
  style?: ViewStyle;
}

export const formatVndPrice = (price?: number | null): string => {
  if (!price || price <= 0) return 'Liên hệ giá';
  if (price >= 1_000_000_000) {
    const billions = (price / 1_000_000_000).toFixed(2);
    return `${billions} tỷ VNĐ`;
  }
  const millions = (price / 1_000_000).toFixed(0);
  return `${millions} triệu VNĐ`;
};

export const PriceTag: React.FC<PriceTagProps> = ({
  price,
  originalPrice,
  size = 'md',
  showInstallment = false,
  style,
}) => {
  const getPriceFontSize = () => {
    switch (size) {
      case 'sm':
        return typography.sizes.sm;
      case 'lg':
        return typography.sizes.xl;
      case 'xl':
        return typography.sizes['2xl'];
      case 'md':
      default:
        return typography.sizes.md;
    }
  };

  const formattedPrice = formatVndPrice(price);

  // Estimate monthly installment: ~80% loan, 7 years, ~8.5% interest
  const monthlyEst =
    price && price > 0
      ? Math.round(((price * 0.8) / (7 * 12)) * 1.08 / 1_000_000)
      : 0;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.priceRow}>
        <Text
          style={[
            styles.price,
            {
              fontSize: getPriceFontSize(),
            },
          ]}
        >
          {formattedPrice}
        </Text>

        {originalPrice && originalPrice > (price || 0) && (
          <Text style={styles.originalPrice}>
            {formatVndPrice(originalPrice)}
          </Text>
        )}
      </View>

      {showInstallment && monthlyEst > 0 && (
        <View style={styles.installmentPill}>
          <Ionicons name="card-outline" size={11} color={colors.primaryHover} style={{ marginRight: 4 }} />
          <Text style={styles.installmentText}>
            Trả góp từ ~{monthlyEst} tr/tháng
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  price: {
    color: colors.primaryHover,
    fontWeight: typography.weights.bold,
    letterSpacing: -0.2,
  },
  originalPrice: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    textDecorationLine: 'line-through',
  },
  installmentPill: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  installmentText: {
    color: colors.primaryHover,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
});

