import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, radii, spacing, typography, shadows } from '../../theme';
import { formatVndPrice } from '../ui/PriceTag';
import { Card } from '../ui/Card';

interface InstallmentCalculatorProps {
  price: number;
}

const DOWN_PAYMENT_PERCENTAGES = [20, 30, 50, 70];
const LOAN_TERMS_YEARS = [1, 2, 3, 5, 7];

export const InstallmentCalculator: React.FC<InstallmentCalculatorProps> = ({ price }) => {
  const [downPercent, setDownPercent] = useState<number>(30);
  const [termYears, setTermYears] = useState<number>(5);
  const interestRateYear = 0.085; // 8.5% / year fixed average

  const downPaymentAmount = Math.round((price * downPercent) / 100);
  const loanAmount = price - downPaymentAmount;
  const totalMonths = termYears * 12;

  // Monthly principal + monthly interest (simple amortization estimation)
  const monthlyPrincipal = loanAmount / totalMonths;
  const monthlyInterest = (loanAmount * interestRateYear) / 12;
  const estimatedMonthlyPayment = Math.round(monthlyPrincipal + monthlyInterest);

  return (
    <Card style={styles.container}>
      <Text style={styles.cardTitle}>📊 Dự Toán Vay Mua Xe Trả Góp</Text>
      <Text style={styles.cardSubtitle}>
        Lãi suất ưu đãi từ các ngân hàng đối tác VIP (khoảng 8.5%/năm)
      </Text>

      {/* Down Payment Selection */}
      <Text style={styles.fieldLabel}>Tỷ Lệ Trả Trước ({downPercent}%)</Text>
      <View style={styles.pillRow}>
        {DOWN_PAYMENT_PERCENTAGES.map((pct) => (
          <TouchableOpacity
            key={pct}
            activeOpacity={0.8}
            onPress={() => setDownPercent(pct)}
            style={[
              styles.pill,
              downPercent === pct ? styles.pillActive : styles.pillInactive,
            ]}
          >
            <Text
              style={[
                styles.pillText,
                downPercent === pct ? styles.pillTextActive : styles.pillTextInactive,
              ]}
            >
              {pct}%
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Loan Term Selection */}
      <Text style={styles.fieldLabel}>Thời Hạn Vay ({termYears} năm / {totalMonths} tháng)</Text>
      <View style={styles.pillRow}>
        {LOAN_TERMS_YEARS.map((yr) => (
          <TouchableOpacity
            key={yr}
            activeOpacity={0.8}
            onPress={() => setTermYears(yr)}
            style={[
              styles.pill,
              termYears === yr ? styles.pillActive : styles.pillInactive,
            ]}
          >
            <Text
              style={[
                styles.pillText,
                termYears === yr ? styles.pillTextActive : styles.pillTextInactive,
              ]}
            >
              {yr} Năm
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Results Breakdown */}
      <View style={styles.resultBox}>
        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>Trả trước ({downPercent}%):</Text>
          <Text style={styles.resultValue}>{formatVndPrice(downPaymentAmount)}</Text>
        </View>

        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>Số tiền cần vay:</Text>
          <Text style={styles.resultValue}>{formatVndPrice(loanAmount)}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.highlightRow}>
          <View>
            <Text style={styles.highlightLabel}>Ước tính trả hàng tháng:</Text>
            <Text style={styles.highlightSub}>Gốc + Lãi bình quân</Text>
          </View>
          <Text style={styles.highlightAmount}>
            ~{(estimatedMonthlyPayment / 1_000_000).toFixed(1)} tr/tháng
          </Text>
        </View>
      </View>

      <Text style={styles.disclaimer}>
        * Số liệu mang tính chất tham khảo. Chuyên viên tài chính AutoMatch sẽ liên hệ hỗ trợ gói vay tối ưu nhất.
      </Text>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    marginVertical: spacing.md,
    ...shadows.sm,
  },
  cardTitle: {
    color: colors.text,
    fontSize: typography.sizes.base + 1,
    fontWeight: typography.weights.bold,
  },
  cardSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  fieldLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.xs,
  },
  pillRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  pill: {
    flex: 1,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillInactive: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
  },
  pillActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  pillText: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.bold,
  },
  pillTextInactive: {
    color: colors.textSecondary,
  },
  pillTextActive: {
    color: colors.primary,
  },
  resultBox: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  resultLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
  },
  resultValue: {
    color: colors.text,
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.semibold,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs + 2,
  },
  highlightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  highlightLabel: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  highlightSub: {
    color: colors.textMuted,
    fontSize: typography.sizes['2xs'],
    marginTop: 1,
  },
  highlightAmount: {
    color: colors.primary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.extrabold,
  },
  disclaimer: {
    color: colors.textMuted,
    fontSize: typography.sizes['2xs'],
    fontStyle: 'italic',
    marginTop: spacing.sm,
    lineHeight: 14,
  },
});
