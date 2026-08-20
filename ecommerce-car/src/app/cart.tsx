import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '../theme';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { globalAlert } from '../store/useDialogStore';
import { useResponsive } from '../hooks/useResponsive';
import { ResponsiveContainer } from '../components/ui/ResponsiveContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { formatVnd, formatVndPrice, usdToVnd } from '../utils/currency';
import { FALLBACK_CAR_URL } from '../constants/images';

export default function CartScreen() {
  const { items, fetchCart, updateQuantity, removeFromCart, isLoading } = useCartStore();
  const { user } = useAuthStore();
  const { isMobile, isLargeScreen } = useResponsive();

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const rawTotalVnd = items.reduce((sum, item) => {
    const itemPriceVnd = usdToVnd(item.car?.price || 0, {
      engineHp: item.car?.engine_hp,
      fuelType: item.car?.metadata?.engine_fuel_type || item.car?.metadata?.fuel_type,
    });
    return sum + itemPriceVnd * item.quantity;
  }, 0);

  // 10% standard deposit for car reservations
  const depositRate = 0.10;
  const depositAmountVnd = Math.round(rawTotalVnd * depositRate);

  const fallbackImage = FALLBACK_CAR_URL;

  if (items.length === 0 && !isLoading) {
    return (
      <View style={styles.screen}>
        <View style={styles.header}>
          <View style={styles.headerInner}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={16} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Giỏ Hàng Đặt Cọc</Text>
          </View>
        </View>

        <EmptyState
          icon="bag-handle-outline"
          title="Giỏ hàng trống"
          description="Bạn chưa chọn mẫu xe nào để đặt cọc."
          actionTitle="Khám phá kho xe"
          onAction={() => router.push('/(tabs)/catalog' as any)}
        />
      </View>
    );
  }

  const handleProceedToCheckout = () => {
    if (!user) {
      globalAlert(
        'Yêu Cầu Đăng Nhập',
        'Vui lòng đăng nhập tài khoản để tiến hành đặt cọc và tạo hợp đồng điện tử.',
        [
          { text: 'Để sau', style: 'cancel' },
          {
            text: 'Đăng nhập',
            onPress: () => router.push('/(auth)/login' as any),
          },
        ]
      );
      return;
    }
    router.push('/checkout' as any);
  };

  const renderSummaryCard = () => (
    <Card style={styles.summaryCard} padding={spacing.md}>
      <Text style={styles.summaryTitle}>Tóm tắt đặt cọc</Text>

      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Tổng giá trị niêm yết:</Text>
        <Text style={styles.summaryValue}>{formatVnd(rawTotalVnd)}</Text>
      </View>

      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Tiền cọc giữ xe (10%):</Text>
        <Text style={styles.summaryValue}>{formatVnd(depositAmountVnd)}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.totalRow}>
        <View>
          <Text style={styles.totalLabel}>Tổng tiền cọc:</Text>
          <Text style={styles.totalSub}>Hoàn cọc 100% trong 7 ngày</Text>
        </View>
        <Text style={styles.totalAmount}>{formatVnd(depositAmountVnd)}</Text>
      </View>

      {/* Action button inside card on Desktop */}
      {isLargeScreen && (
        <Button
          title="Tiến Hành Đặt Cọc"
          variant="primary"
          size="md"
          onPress={handleProceedToCheckout}
          style={styles.desktopCheckoutBtn}
          icon={<Ionicons name="arrow-forward" size={14} color="#FFFFFF" />}
        />
      )}

      {/* Security & Warranty Notice */}
      <View style={styles.noticeBox}>
        <Ionicons name="shield-checkmark-outline" size={14} color={colors.primaryHover} />
        <Text style={styles.noticeText}>
          Giao dịch cọc bảo mật qua cổng ZaloPay hoặc chuyển khoản ngân hàng AutoMatch.
        </Text>
      </View>
    </Card>
  );

  return (
    <View style={styles.screen}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={16} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Giỏ Hàng Đặt Cọc ({items.length})</Text>
        </View>
      </View>

      <ResponsiveContainer scrollable maxWidth="xl" showsVerticalScrollIndicator={false}>
        <View style={[styles.cartLayout, isLargeScreen && styles.cartLayoutSplit]}>
          {/* Cart Items List Column */}
          <View style={[styles.itemsColumn, isLargeScreen && styles.itemsColumnSplit]}>
            <Text style={styles.sectionHeader}>Danh sách xe giữ chỗ</Text>

            {items.map((item) => (
              <Card key={item.id} style={styles.itemCard} padding={spacing.sm}>
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
                      <Ionicons name="trash-outline" size={14} color={colors.danger} />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.itemYear}>Năm {item.car?.year || 2024}</Text>
                  <Text style={styles.itemPrice}>
                    {formatVndPrice(item.car?.price, 'usd', {
                      engineHp: item.car?.engine_hp,
                      fuelType: item.car?.metadata?.engine_fuel_type || item.car?.metadata?.fuel_type,
                    })}
                  </Text>

                  {/* Quantity Stepper */}
                  <View style={styles.stepperRow}>
                    <Text style={styles.qtyLabel}>Số lượng:</Text>
                    <View style={styles.stepper}>
                      <TouchableOpacity
                        onPress={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        style={styles.stepBtn}
                      >
                        <Ionicons name="remove" size={11} color={colors.text} />
                      </TouchableOpacity>
                      <Text style={styles.stepValue}>{item.quantity}</Text>
                      <TouchableOpacity
                        onPress={() => updateQuantity(item.id, item.quantity + 1)}
                        style={styles.stepBtn}
                      >
                        <Ionicons name="add" size={11} color={colors.text} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Card>
            ))}

            {/* Mobile Summary Card */}
            {isMobile && renderSummaryCard()}
          </View>

          {/* Desktop Summary Sidebar */}
          {isLargeScreen && (
            <View style={styles.summarySidebarSplit}>
              {renderSummaryCard()}
            </View>
          )}
        </View>

        <View style={{ height: isMobile ? 80 : 32 }} />
      </ResponsiveContainer>

      {/* Bottom Sticky Checkout Action (Mobile Only) */}
      {isMobile && (
        <View style={styles.bottomCheckoutBar}>
          <View style={styles.bottomTotalGroup}>
            <Text style={styles.bottomDepositLabel}>Tiền cọc:</Text>
            <Text style={styles.bottomDepositAmount}>{formatVnd(depositAmountVnd)}</Text>
          </View>

          <Button
            title="Tiến Hành Cọc"
            variant="primary"
            size="sm"
            onPress={handleProceedToCheckout}
            style={styles.checkoutBtn}
            icon={<Ionicons name="arrow-forward" size={13} color="#FFFFFF" />}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 48,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  headerInner: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerTitle: {
    color: colors.text,
    fontSize: typography.sizes.sm + 1,
    fontWeight: typography.weights.semibold,
    lineHeight: 20,
  },
  cartLayout: {
    width: '100%',
  },
  cartLayoutSplit: {
    flexDirection: 'row',
    gap: spacing.xl,
    alignItems: 'flex-start',
    marginTop: spacing.md,
  },
  itemsColumn: {
    width: '100%',
  },
  itemsColumnSplit: {
    flex: 1.4,
  },
  summarySidebarSplit: {
    flex: 1,
    position: 'sticky' as any,
    top: 20,
  },
  sectionHeader: {
    color: colors.text,
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.semibold,
    lineHeight: 18,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  itemCard: {
    flexDirection: 'row',
    marginBottom: spacing.xs + 2,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  itemThumb: {
    width: 75,
    height: 60,
    borderRadius: radii.sm,
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
    fontSize: 11,
    fontWeight: typography.weights.semibold,
    lineHeight: 15,
    flex: 1,
  },
  deleteBtn: {
    padding: 2,
  },
  itemYear: {
    color: colors.textMuted,
    fontSize: 10,
  },
  itemPrice: {
    color: colors.primaryHover,
    fontSize: 11,
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
    fontSize: 10,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  stepBtn: {
    width: 24,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: {
    color: colors.text,
    fontSize: 10,
    fontWeight: typography.weights.bold,
    paddingHorizontal: 6,
  },
  summaryCard: {
    marginTop: spacing.md,
    borderRadius: radii.lg,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: colors.surfaceElevated,
  },
  summaryTitle: {
    color: colors.text,
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.semibold,
    lineHeight: 18,
    marginBottom: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
  summaryValue: {
    color: colors.text,
    fontSize: 11,
    fontWeight: typography.weights.medium,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
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
    fontSize: 10,
    marginTop: 1,
  },
  totalAmount: {
    color: colors.primaryHover,
    fontSize: typography.sizes.sm + 1,
    fontWeight: typography.weights.bold,
  },
  desktopCheckoutBtn: {
    marginTop: spacing.sm,
  },
  noticeBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: radii.sm,
    padding: spacing.sm,
    marginTop: spacing.xs,
    gap: spacing.xs + 2,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  noticeText: {
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 14,
    flex: 1,
  },
  bottomCheckoutBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs + 2,
    paddingBottom: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  bottomTotalGroup: {
    flex: 1,
  },
  bottomDepositLabel: {
    color: colors.textSecondary,
    fontSize: 10,
  },
  bottomDepositAmount: {
    color: colors.primaryHover,
    fontSize: typography.sizes.sm + 1,
    fontWeight: typography.weights.bold,
  },
  checkoutBtn: {
    flex: 1,
    height: 38,
  },
});
