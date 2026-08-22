import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, typography } from '../../theme';
import {
  formatVndPrice,
  usdToVnd,
  formatCarPrice,
  CarSpecInput,
  calculateInstallmentPlan,
} from '../../utils/currency';

export { formatVndPrice, usdToVnd, formatCarPrice };

interface PriceTagProps {
  price?: number | null;
  originalPrice?: number | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showInstallment?: boolean;
  spec?: CarSpecInput;
  style?: ViewStyle;
}

export const PriceTag: React.FC<PriceTagProps> = ({
  price,
  originalPrice,
  size = 'md',
  showInstallment = false,
  spec,
  style,
}) => {
  const getPriceFontSize = () => {
    switch (size) {
      case 'sm':
        return typography.sizes.xs + 1;
      case 'lg':
        return typography.sizes.lg;
      case 'xl':
        return typography.sizes.xl;
      case 'md':
      default:
        return typography.sizes.base;
    }
  };

  const formattedPrice = formatVndPrice(price, 'usd', spec);
  const priceVnd = usdToVnd(price, spec);

  // Estimate monthly installment: 30% down payment, 7 years, 8.5% interest
  const installment = calculateInstallmentPlan(priceVnd, 30, 7, 0.085);
  const monthlyEstMillion =
    priceVnd > 0 ? (installment.totalMonthlyPayment / 1_000_000).toFixed(1) : '0';

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
            {formatVndPrice(originalPrice, 'usd', spec)}
          </Text>
        )}
      </View>

      {showInstallment && priceVnd > 0 && (
        <View style={styles.installmentPill}>
          <Ionicons name="card-outline" size={10} color={colors.primaryHover} style={{ marginRight: 3 }} />
          <Text style={styles.installmentText}>
            Góp từ ~{monthlyEstMillion} tr/tháng
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
    gap: 6,
  },
  price: {
    color: colors.primaryHover,
    fontWeight: typography.weights.bold,
    letterSpacing: -0.2,
  },
  originalPrice: {
    color: colors.textMuted,
    fontSize: typography.sizes['2xs'],
    textDecorationLine: 'line-through',
  },
  installmentPill: {
    marginTop: 3,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  installmentText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: typography.weights.medium,
  },
});

