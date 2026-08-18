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
    paddingTop: 48,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm + 2,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm + 2,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: colors.text,
    fontSize: typography.sizes.base + 1,
    fontWeight: typography.weights.semibold,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  sectionHeader: {
    color: colors.text,
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.semibold,
    marginTop: spacing.md,
    marginBottom: spacing.xs + 2,
  },
  itemCard: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  itemThumb: {
    width: 80,
    height: 68,
    borderRadius: radii.xs,
    backgroundColor: colors.surfaceElevated,
  },
  itemInfo: {
    flex: 1,
    marginLeft: spacing.sm + 2,
    justifyContent: 'space-between',
  },
  itemTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemCarName: {
    color: colors.text,
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.semibold,
    flex: 1,
  },
  deleteBtn: {
    padding: 2,
  },
  itemYear: {
    color: colors.textMuted,
    fontSize: typography.sizes['2xs'],
  },
  itemPrice: {
    color: colors.primaryHover,
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.bold,
    marginVertical: 1,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  qtyLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes['2xs'],
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepBtn: {
    width: 24,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: {
    color: colors.text,
    fontSize: typography.sizes['2xs'],
    fontWeight: typography.weights.bold,
    paddingHorizontal: 6,
  },
  summaryCard: {
    marginTop: spacing.md,
    gap: spacing.xs + 2,
  },
  summaryTitle: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    marginBottom: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes['2xs'] + 1,
  },
  summaryValue: {
    color: colors.text,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    color: colors.text,
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.semibold,
  },
  totalSub: {
    color: colors.textMuted,
    fontSize: typography.sizes['2xs'],
    marginTop: 1,
  },
  totalAmount: {
    color: colors.primaryHover,
    fontSize: typography.sizes.base + 1,
    fontWeight: typography.weights.bold,
  },
  noticeBox: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: spacing.sm,
    marginTop: spacing.md,
    gap: spacing.xs + 2,
    alignItems: 'flex-start',
  },
  noticeText: {
    color: colors.textSecondary,
    fontSize: typography.sizes['2xs'] + 1,
    lineHeight: 16,
    flex: 1,
  },
  bottomCheckoutBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs + 3,
    paddingBottom: 24,
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
    fontSize: typography.sizes['2xs'],
  },
  bottomDepositAmount: {
    color: colors.primaryHover,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  checkoutBtn: {
    flex: 1.2,
    height: 40,
  },
});

