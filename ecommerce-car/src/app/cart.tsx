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

  const fallbackImage =
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=800';

  if (items.length === 0) {
    return (
      <View style={styles.screen}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Giỏ Hàng Đặt Cọc</Text>
        </View>

        <EmptyState
          icon="cart-outline"
          title="Giỏ Hàng Của Bạn Đang Trống"
          description="Bạn chưa chọn mẫu xe nào để đặt cọc. Hãy khám phá kho xe mới nhất tại AutoMatch!"
          actionTitle="Khám Phá Danh Mục Ngay"
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
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Giỏ Hàng Đặt Cọc ({items.length})</Text>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Cart Items List */}
        <Text style={styles.sectionHeader}>Danh Sách Xe Đặt Giữ Chỗ</Text>

        {items.map((item) => (
          <Card key={item.id} style={styles.itemCard}>
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
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                </TouchableOpacity>
              </View>

              <Text style={styles.itemYear}>Năm sản xuất: {item.car?.year || 2024}</Text>
              <Text style={styles.itemPrice}>{formatVndPrice(item.car?.price)}</Text>

              {/* Quantity Stepper */}
              <View style={styles.stepperRow}>
                <Text style={styles.qtyLabel}>Số lượng xe:</Text>
                <View style={styles.stepper}>
                  <TouchableOpacity
                    onPress={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                    style={styles.stepBtn}
                  >
                    <Ionicons name="remove" size={14} color={colors.text} />
                  </TouchableOpacity>
                  <Text style={styles.stepValue}>{item.quantity}</Text>
                  <TouchableOpacity
                    onPress={() => updateQuantity(item.id, item.quantity + 1)}
                    style={styles.stepBtn}
                  >
                    <Ionicons name="add" size={14} color={colors.text} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Card>
        ))}

        {/* Price Breakdown Summary */}
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Tóm Tắt Đặt Cọc & Thanh Toán</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tổng giá trị niêm yết:</Text>
            <Text style={styles.summaryValue}>{formatVndPrice(rawTotal)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Mức đặt cọc giữ xe (10%):</Text>
            <Text style={styles.summaryValue}>{formatVndPrice(depositAmount)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <View>
              <Text style={styles.totalLabel}>Tổng Cọc Cần Thanh Toán:</Text>
              <Text style={styles.totalSub}>Hoàn cọc 100% nếu đổi ý trong 7 ngày</Text>
            </View>
            <Text style={styles.totalAmount}>{formatVndPrice(depositAmount)}</Text>
          </View>
        </Card>

        {/* Security & Warranty Notice */}
        <View style={styles.noticeBox}>
          <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
          <Text style={styles.noticeText}>
            Giao dịch được bảo mật và thực hiện trực tiếp qua cổng thanh toán số ZaloPay hoặc chuyển khoản ngân hàng chính thức của AutoMatch.
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Sticky Checkout Action */}
      <View style={styles.bottomCheckoutBar}>
        <View style={styles.bottomTotalGroup}>
          <Text style={styles.bottomDepositLabel}>Tiền cọc giữ xe:</Text>
          <Text style={styles.bottomDepositAmount}>{formatVndPrice(depositAmount)}</Text>
        </View>

        <Button
          title="Tiến Hành Đặt Cọc"
          variant="primary"
          size="lg"
          onPress={() => router.push('/checkout' as any)}
          style={styles.checkoutBtn}
          icon={<Ionicons name="arrow-forward" size={18} color={colors.textDark} />}
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
    paddingTop: 52,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  sectionHeader: {
    color: colors.text,
    fontSize: typography.sizes.sm + 1,
    fontWeight: typography.weights.bold,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  itemCard: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  itemThumb: {
    width: 90,
    height: 75,
    borderRadius: radii.sm,
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
    fontSize: typography.sizes.sm + 1,
    fontWeight: typography.weights.bold,
    flex: 1,
  },
  deleteBtn: {
    padding: 2,
  },
  itemYear: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
  },
  itemPrice: {
    color: colors.primary,
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
    borderRadius: radii.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepBtn: {
    width: 26,
    height: 24,
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
    marginTop: spacing.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  summaryTitle: {
    color: colors.text,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xs,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs + 1,
  },
  summaryValue: {
    color: colors.text,
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.semibold,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    color: colors.text,
    fontSize: typography.sizes.sm + 1,
    fontWeight: typography.weights.bold,
  },
  totalSub: {
    color: colors.textMuted,
    fontSize: typography.sizes['2xs'],
    marginTop: 2,
  },
  totalAmount: {
    color: colors.primary,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.extrabold,
  },
  noticeBox: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.md,
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
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.lg,
  },
  bottomTotalGroup: {
    flex: 1,
  },
  bottomDepositLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
  },
  bottomDepositAmount: {
    color: colors.primary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.extrabold,
  },
  checkoutBtn: {
    flex: 1.2,
    height: 48,
  },
});
