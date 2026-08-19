import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography, shadows } from '../theme';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { formatVndPrice } from '../components/ui/PriceTag';
import { FALLBACK_CAR_URL } from '../constants/images';

export default function CartScreen() {
  const { items, fetchCart, updateQuantity, removeFromCart, getTotalPrice } = useCartStore();
  const { user } = useAuthStore();

  useEffect(() => {
    fetchCart(user?.id);
  }, [fetchCart, user]);

  const rawTotal = getTotalPrice();
  // 10% standard deposit for car reservations
  const depositRate = 0.10;
  const depositAmount = Math.round(rawTotal * depositRate);

  const fallbackImage = FALLBACK_CAR_URL;

  if (items.length === 0) {
    return (
      <View style={styles.screen}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={18} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Giỏ Hàng Đặt Cọc</Text>
        </View>

        <EmptyState
          icon="bag-handle-outline"
          title="Giỏ hàng trống"
          description="Bạn chưa chọn mẫu xe nào để đặt cọc. Hãy khám phá kho xe tại Showroom!"
          actionTitle="Khám phá kho xe"
          onAction={() => router.push('/(tabs)/catalog' as any)}
        />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Giỏ Hàng Đặt Cọc ({items.length})</Text>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Cart Items List */}
        <Text style={styles.sectionHeader}>Danh sách xe giữ chỗ</Text>

        {items.map((item) => (
          <Card key={item.id} style={styles.itemCard} padding={spacing.sm + 2}>
            <Image
              source={{ uri: item.car?.image_url || fallbackImage }}
              style={styles.itemThumb}
              contentFit="cover"
            />

            <View style={styles.itemInfo}>
              <View style={styles.itemTitleRow}>
                <Text style={styles.itemCarName} numberOfLines={1}>
                  {item.car ? `${item.car.make} ${item.car.model}` : 'Mẫu xe AutoMatch'}
                </Text>
                <TouchableOpacity
                  onPress={() => removeFromCart(item.id)}
                  style={styles.deleteBtn}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.danger} />
                </TouchableOpacity>
              </View>

              <Text style={styles.itemYear}>Năm {item.car?.year || 2024}</Text>
              <Text style={styles.itemPrice}>{formatVndPrice(item.car?.price)}</Text>

              {/* Quantity Stepper */}
              <View style={styles.stepperRow}>
                <Text style={styles.qtyLabel}>Số lượng:</Text>
                <View style={styles.stepper}>
                  <TouchableOpacity
                    onPress={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                    style={styles.stepBtn}
                  >
                    <Ionicons name="remove" size={13} color={colors.text} />
                  </TouchableOpacity>
                  <Text style={styles.stepValue}>{item.quantity}</Text>
                  <TouchableOpacity
                    onPress={() => updateQuantity(item.id, item.quantity + 1)}
                    style={styles.stepBtn}
                  >
                    <Ionicons name="add" size={13} color={colors.text} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Card>
        ))}

        {/* Price Breakdown Summary */}
        <Card style={styles.summaryCard} padding={spacing.md}>
          <Text style={styles.summaryTitle}>Tóm tắt đặt cọc</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tổng giá trị niêm yết:</Text>
            <Text style={styles.summaryValue}>{formatVndPrice(rawTotal)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tiền cọc giữ xe (10%):</Text>
            <Text style={styles.summaryValue}>{formatVndPrice(depositAmount)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <View>
              <Text style={styles.totalLabel}>Tổng cọc cần thanh toán:</Text>
              <Text style={styles.totalSub}>Cam kết hoàn cọc 100% trong 7 ngày</Text>
            </View>
            <Text style={styles.totalAmount}>{formatVndPrice(depositAmount)}</Text>
          </View>
        </Card>

        {/* Security & Warranty Notice */}
        <View style={styles.noticeBox}>
          <Ionicons name="shield-checkmark-outline" size={16} color={colors.primaryHover} />
          <Text style={styles.noticeText}>
            Giao dịch cọc được bảo mật và thực hiện qua cổng thanh toán ZaloPay hoặc chuyển khoản ngân hàng chính thức của AutoMatch.
          </Text>
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Bottom Sticky Checkout Action */}
      <View style={styles.bottomCheckoutBar}>
        <View style={styles.bottomTotalGroup}>
          <Text style={styles.bottomDepositLabel}>Tiền cọc:</Text>
          <Text style={styles.bottomDepositAmount}>{formatVndPrice(depositAmount)}</Text>
        </View>

        <Button
          title="Tiến Hành Đặt Cọc"
          variant="primary"
          size="md"
          onPress={() => router.push('/checkout' as any)}
          style={styles.checkoutBtn}
          icon={<Ionicons name="arrow-forward" size={15} color="#FFFFFF" />}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    gap: spacing.md,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    lineHeight: 24,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing['2xl'],
  },
  sectionHeader: {
    color: colors.text,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    lineHeight: 22,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  itemCard: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radii.lg,
    ...shadows.sm,
  },
  itemThumb: {
    width: 90,
    height: 75,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceElevated,
  },
  itemInfo: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: 'space-between',
  },
  itemTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemCarName: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    lineHeight: 18,
    flex: 1,
  },
  deleteBtn: {
    padding: 4,
  },
  itemYear: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
  },
  itemPrice: {
    color: colors.primaryHover,
    fontSize: typography.sizes.sm + 1,
    fontWeight: typography.weights.bold,
    marginVertical: 2,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  qtyLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.sm,
  },
  stepBtn: {
    width: 28,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: {
    color: colors.text,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    paddingHorizontal: 8,
  },
  summaryCard: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: radii.lg,
    gap: spacing.sm,
    ...shadows.sm,
  },
  summaryTitle: {
    color: colors.text,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    lineHeight: 22,
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    lineHeight: 18,
  },
  summaryValue: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: spacing.sm,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    color: colors.text,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
  totalSub: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  totalAmount: {
    color: colors.primaryHover,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  noticeBox: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.lg,
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  noticeText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    lineHeight: 18,
    flex: 1,
  },
  bottomCheckoutBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.md,
    paddingBottom: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.md,
  },
  bottomTotalGroup: {
    flex: 1,
  },
  bottomDepositLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
  },
  bottomDepositAmount: {
    color: colors.primaryHover,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  checkoutBtn: {
    flex: 1.2,
    height: 46,
  },
});

