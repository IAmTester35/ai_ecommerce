import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
      <View style={styles.headerRow}>
        <Ionicons name="calculator-outline" size={18} color={colors.primaryHover} />
        <Text style={styles.cardTitle}>Dự Toán Vay Trả Góp</Text>
      </View>
      <Text style={styles.cardSubtitle}>
        Lãi suất tham khảo ~8.5%/năm từ các đối tác ngân hàng
      </Text>

      {/* Down Payment Selection */}
      <Text style={styles.fieldLabel}>Tỷ lệ trả trước ({downPercent}%)</Text>
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
      <Text style={styles.fieldLabel}>Thời hạn vay ({termYears} năm / {totalMonths} tháng)</Text>
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
          <Text style={styles.resultLabel}>Số tiền vay:</Text>
          <Text style={styles.resultValue}>{formatVndPrice(loanAmount)}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.highlightRow}>
          <View>
            <Text style={styles.highlightLabel}>Ước tính hàng tháng:</Text>
            <Text style={styles.highlightSub}>Gốc + Lãi bình quân</Text>
          </View>
          <Text style={styles.highlightAmount}>
            ~{(estimatedMonthlyPayment / 1_000_000).toFixed(1)} tr/tháng
          </Text>
        </View>
      </View>

      <Text style={styles.disclaimer}>
        * Số liệu ước tính tham khảo. Tư vấn viên sẽ liên hệ để cung cấp lịch trả chi tiết.
      </Text>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    marginVertical: spacing.sm,
    ...shadows.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    color: colors.text,
    fontSize: typography.sizes.sm + 1,
    fontWeight: typography.weights.semibold,
  },
  cardSubtitle: {
    color: colors.textMuted,
    fontSize: typography.sizes['2xs'],
    marginTop: 2,
    marginBottom: spacing.sm + 2,
  },
  fieldLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes['2xs'],
    fontWeight: typography.weights.medium,
    marginBottom: 4,
  },
  pillRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  pill: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: radii.xs,
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
    fontSize: typography.sizes['2xs'] + 1,
    fontWeight: typography.weights.semibold,
  },
  pillTextInactive: {
    color: colors.textSecondary,
  },
  pillTextActive: {
    color: colors.primaryHover,
  },
  resultBox: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: spacing.sm + 2,
    marginTop: spacing.xs,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  resultLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes['2xs'] + 1,
  },
  resultValue: {
    color: colors.text,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  highlightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  highlightLabel: {
    color: colors.text,
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.semibold,
  },
  highlightSub: {
    color: colors.textMuted,
    fontSize: typography.sizes['2xs'],
    marginTop: 1,
  },
  highlightAmount: {
    color: colors.primaryHover,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  disclaimer: {
    color: colors.textMuted,
    fontSize: typography.sizes['2xs'],
    fontStyle: 'italic',
    marginTop: spacing.xs + 2,
    lineHeight: 14,
  },
});

