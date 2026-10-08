import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, spacing, typography } from '../theme';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { useVoucherStore } from '../store/useVoucherStore';
import { globalAlert } from '../store/useDialogStore';
import { useResponsive } from '../hooks/useResponsive';
import { ResponsiveContainer } from '../components/ui/ResponsiveContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { SwipeableCartItem } from '../components/car/SwipeableCartItem';
import { formatVnd, usdToVnd } from '../utils/currency';

const QUICK_CATEGORIES = [
  { label: 'SUV Đa Dụng', query: 'SUV' },
  { label: 'Sedan Cao Cấp', query: 'Sedan' },
  { label: 'Xe Thuần Điện EV', query: 'Electric' },
  { label: 'Xe Thể Thao', query: 'Coupe' },
];

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const { items, fetchCart, updateQuantity, removeFromCart, isLoading } = useCartStore();
  const { user } = useAuthStore();
  const { isMobile, isLargeScreen } = useResponsive();
  const {
    vouchers,
    appliedVoucher,
    discountAmount,
    fetchVouchers,
    applyVoucherByCode,
    removeVoucher,
    recalculateDiscount,
  } = useVoucherStore();

  const [promoInput, setPromoInput] = useState('');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  // 1. Fetch Cart & Available Vouchers
  useEffect(() => {
    fetchCart();
    fetchVouchers();
  }, [fetchCart, fetchVouchers]);

  // 2. Financial Calculations
  const rawTotalVnd = useMemo(() => {
    return items.reduce((sum, item) => {
      const itemPriceVnd = usdToVnd(item.car?.price || 0, {
        engineHp: item.car?.engine_hp,
        fuelType: item.car?.metadata?.engine_fuel_type || item.car?.metadata?.fuel_type,
      });
      return sum + itemPriceVnd * item.quantity;
    }, 0);
  }, [items]);

  // Recalculate discount whenever total changes
  useEffect(() => {
    recalculateDiscount(rawTotalVnd);
  }, [rawTotalVnd, recalculateDiscount]);

  const netTotalVnd = Math.max(0, rawTotalVnd - discountAmount);
  // Standard 10% deposit for vehicle reservations
  const depositRate = 0.10;
  const depositAmountVnd = Math.round(netTotalVnd * depositRate);
  const remainingAmountVnd = Math.max(0, netTotalVnd - depositAmountVnd);

  // Handle Promo Code submission
  const handleApplyPromo = async (codeToApply?: string) => {
    const code = (codeToApply || promoInput).trim();
    if (!code) {
      globalAlert('Thông báo', 'Vui lòng nhập mã ưu đãi.');
      return;
    }

    setIsApplyingPromo(true);
    const res = await applyVoucherByCode(code, rawTotalVnd);
    setIsApplyingPromo(false);

    if (res.success) {
      setPromoInput('');
      globalAlert('Áp dụng thành công', res.message || 'Mã ưu đãi đã được áp dụng vào đơn!');
    } else {
      globalAlert('Mã không hợp lệ', res.message || 'Mã ưu đãi không áp dụng được cho đơn này.');
    }
  };

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

  // 5. Empty Cart State
  if (items.length === 0 && !isLoading) {
    return (
      <View style={styles.screen}>
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 44) }]}>
          <View style={styles.headerInner}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.back()}
              accessibilityLabel="Quay lại"
            >
              <Ionicons name="arrow-back" size={16} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Giỏ Hàng Đặt Cọc</Text>
          </View>
        </View>

        <ResponsiveContainer scrollable maxWidth="md">
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <View style={styles.emptyIconGlow} />
              <Ionicons name="bag-handle-outline" size={36} color={colors.primaryHover} />
            </View>

            <Text style={styles.emptyTitle}>Giỏ hàng của bạn đang trống</Text>
            <Text style={styles.emptySubtitle}>
              Bạn chưa chọn mẫu xe nào để đặt cọc. Hãy khám phá kho xe cao cấp hoặc trò chuyện cùng trợ lý AI để tìm chiếc xe ưng ý nhất.
            </Text>

            <View style={styles.emptyActionGroup}>
              <Button
                title="Khám Phá Kho Xe"
                variant="primary"
                size="md"
                onPress={() => router.push('/(tabs)/catalog' as any)}
                icon={<Ionicons name="car-sport-outline" size={16} color="#FFFFFF" />}
                style={styles.emptyPrimaryBtn}
              />

              <Button
                title="Tư Vấn Chọn Xe Với AI"
                variant="outline"
                size="md"
                onPress={() => router.push('/(tabs)/ai-chat' as any)}
                icon={<Ionicons name="sparkles" size={15} color={colors.primaryHover} />}
                style={styles.emptySecondaryBtn}
              />
            </View>

            {/* Quick Category Exploration Pills */}
            <View style={styles.quickExploreSection}>
              <Text style={styles.quickExploreTitle}>Gợi ý phân khúc xe được quan tâm:</Text>
              <View style={styles.quickChipsWrap}>
                {QUICK_CATEGORIES.map((cat, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.quickChip}
                    onPress={() => router.push('/(tabs)/catalog' as any)}
                  >
                    <Ionicons name="search-outline" size={11} color={colors.textSecondary} />
                    <Text style={styles.quickChipText}>{cat.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </ResponsiveContainer>
      </View>
    );
  }

  // 6. Promo Code Field Component
  const renderPromoSection = () => (
    <Card style={styles.promoCard} padding={spacing.md}>
      <View style={styles.promoHeaderRow}>
        <Ionicons name="gift-outline" size={15} color={colors.primaryHover} />
        <Text style={styles.cardHeaderTitle}>Mã Ưu Đãi & Khuyến Mãi</Text>
      </View>

      {/* Applied Promo Banner */}
      {appliedVoucher ? (
        <View style={styles.appliedPromoBox}>
          <View style={styles.appliedPromoIconCircle}>
            <Ionicons name="checkmark" size={14} color={colors.success} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.appliedPromoCode}>{appliedVoucher.code}</Text>
              <View style={styles.appliedBadge}>
                <Text style={styles.appliedBadgeText}>ĐÃ ÁP DỤNG</Text>
              </View>
            </View>
            <Text style={styles.appliedPromoDesc} numberOfLines={1}>
              {appliedVoucher.title}
            </Text>
            <Text style={styles.appliedPromoSavings}>
              Tiết kiệm {formatVnd(discountAmount)} trên tổng giá trị xe
            </Text>
          </View>
          <TouchableOpacity
            onPress={removeVoucher}
            style={styles.removePromoBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.removePromoText}>Gỡ bỏ</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Promo Input Box */}
          <View style={styles.promoInputRow}>
            <TextInput
              style={styles.promoInput}
              value={promoInput}
              onChangeText={(val) => setPromoInput(val.toUpperCase())}
              placeholder="Nhập mã ưu đãi (vd: WELCOME10M)"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <Button
              title={isApplyingPromo ? '...' : 'Áp dụng'}
              variant="primary"
              size="sm"
              onPress={() => handleApplyPromo()}
              loading={isApplyingPromo}
              style={styles.promoApplyBtn}
            />
          </View>

          {/* Quick Active Voucher Suggestions */}
          {vouchers.length > 0 && (
            <View style={styles.suggestedVouchersWrap}>
              <Text style={styles.suggestedTitle}>Mã ưu đãi đang diễn ra:</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.voucherChipsScroll}
              >
                {vouchers.map((v) => (
                  <TouchableOpacity
                    key={v.id}
                    style={styles.voucherChip}
                    onPress={() => handleApplyPromo(v.code)}
                    activeOpacity={0.75}
                  >
                    <Ionicons name="pricetag-outline" size={11} color={colors.primaryHover} />
                    <Text style={styles.voucherChipCode}>{v.code}</Text>
                    <Text style={styles.voucherChipTitle} numberOfLines={1}>
                      • {v.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </>
      )}
    </Card>
  );

  // 4. Price Breakdown Summary Card
  const renderSummaryCard = () => (
    <Card style={styles.summaryCard} padding={spacing.md}>
      <View style={styles.promoHeaderRow}>
        <Ionicons name="receipt-outline" size={15} color={colors.primaryHover} />
        <Text style={styles.cardHeaderTitle}>Chi Tiết Chi Phí Đặt Cọc</Text>
      </View>

      {/* Itemized Breakdown */}
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Tổng giá trị xe (Niêm yết):</Text>
        <Text style={styles.summaryValue}>{formatVnd(rawTotalVnd)}</Text>
      </View>

      {/* Applied Discount */}
      {discountAmount > 0 && (
        <View style={styles.summaryRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="pricetag" size={12} color={colors.success} />
            <Text style={[styles.summaryLabel, { color: colors.success }]}>
              Ưu đãi giảm giá ({appliedVoucher?.code}):
            </Text>
          </View>
          <Text style={[styles.summaryValue, { color: colors.success, fontWeight: '700' }]}>
            -{formatVnd(discountAmount)}
          </Text>
        </View>
      )}

      {/* Net Car Value */}
      {discountAmount > 0 && (
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { fontWeight: '600', color: colors.text }]}>
            Tổng giá trị sau ưu đãi:
          </Text>
          <Text style={[styles.summaryValue, { fontWeight: '700' }]}>
            {formatVnd(netTotalVnd)}
          </Text>
        </View>
      )}

      {/* Included Taxes info */}
      <View style={styles.taxInfoRow}>
        <Ionicons name="information-circle-outline" size={12} color={colors.textMuted} />
        <Text style={styles.taxInfoText}>
          Giá niêm yết đã bao gồm 10% VAT & Thuế Tiêu Thụ Đặc Biệt.
        </Text>
      </View>

      <View style={styles.divider} />

      {/* Highlight Online Deposit vs Showroom Final Settlement */}
      <View style={styles.depositHighlightBox}>
        <View style={styles.depositRow}>
          <View>
            <View style={styles.depositBadge}>
              <Text style={styles.depositBadgeText}>CỌC TRỰC TUYẾN (10%)</Text>
            </View>
            <Text style={styles.depositSub}>Hoàn cọc 100% trong 7 ngày</Text>
          </View>
          <Text style={styles.depositAmount}>{formatVnd(depositAmountVnd)}</Text>
        </View>
      </View>

      {/* Showroom Remaining Balance */}
      <View style={styles.showroomBalanceRow}>
        <Ionicons name="business-outline" size={12} color={colors.textSecondary} />
        <Text style={styles.showroomBalanceText}>
          Còn lại <Text style={{ color: colors.text, fontWeight: '700' }}>{formatVnd(remainingAmountVnd)}</Text> thanh toán khi nhận xe tại Showroom.
        </Text>
      </View>

      {/* Future Costs Notice */}
      <View style={styles.noticeBox}>
        <Ionicons name="help-circle-outline" size={14} color={colors.primaryHover} style={{ marginTop: 1 }} />
        <Text style={styles.noticeText}>
          💡 Chi phí lăn bánh (lệ phí trước bạ, đăng ký biển số, bảo hiểm) & phí vận chuyển tận nơi sẽ được lựa chọn và tính toán tại bước tiếp theo khi xác nhận địa chỉ nhận xe.
        </Text>
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
    </Card>
  );

  return (
    <View style={styles.screen}>
      {/* Top Navigation Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 44) }]}>
        <View style={styles.headerInner}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            accessibilityLabel="Quay lại"
          >
            <Ionicons name="arrow-back" size={16} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Giỏ Hàng Đặt Cọc ({items.length})</Text>
        </View>
      </View>

      <ResponsiveContainer scrollable maxWidth="xl" showsVerticalScrollIndicator={false}>
        <View style={[styles.cartLayout, isLargeScreen && styles.cartLayoutSplit]}>
          {/* Left Column: Cart Items & Promo Code */}
          <View style={[styles.itemsColumn, isLargeScreen && styles.itemsColumnSplit]}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeader}>Danh sách xe đặt cọc ({items.length})</Text>
              <Text style={styles.swipeHintText}>← Vuốt trái để xóa</Text>
            </View>

            {/* 1. Item List with Variants, Images, Stepper, and Swipe-to-Remove */}
            {items.map((item) => (
              <SwipeableCartItem
                key={item.id}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeFromCart}
              />
            ))}

            {/* 6. Promo Code Section */}
            {renderPromoSection()}

            {/* Mobile Summary Card */}
            {isMobile && renderSummaryCard()}
          </View>

          {/* Right Column: Desktop Summary Sidebar */}
          {isLargeScreen && (
            <View style={styles.summarySidebarSplit}>
              {renderSummaryCard()}
            </View>
          )}
        </View>

        <View style={{ height: isMobile ? 96 : 36 }} />
      </ResponsiveContainer>

      {/* Bottom Sticky Action Bar (Mobile Only) */}
      {isMobile && (
        <View style={[styles.bottomCheckoutBar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
          <View style={styles.bottomTotalGroup}>
            <Text style={styles.bottomDepositLabel}>Tiền cọc giữ xe (10%):</Text>
            <Text style={styles.bottomDepositAmount}>{formatVnd(depositAmountVnd)}</Text>
            {discountAmount > 0 && (
              <Text style={styles.bottomSavingsSub}>Đã giảm {formatVnd(discountAmount)}</Text>
            )}
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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xs + 2,
  },
  sectionHeader: {
    color: colors.text,
    fontSize: typography.sizes.xs + 2,
    fontWeight: typography.weights.bold,
  },
  swipeHintText: {
    color: colors.textMuted,
    fontSize: 10,
    fontStyle: 'italic',
  },
  promoCard: {
    marginTop: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: colors.surfaceElevated,
    gap: spacing.sm,
  },
  promoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  cardHeaderTitle: {
    color: colors.text,
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.bold,
  },
  promoInputRow: {
    flexDirection: 'row',
    gap: spacing.xs + 2,
    alignItems: 'center',
  },
  promoInput: {
    flex: 1,
    height: 38,
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm + 2,
    color: colors.text,
    fontSize: 12,
    fontWeight: typography.weights.semibold,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  promoApplyBtn: {
    minWidth: 80,
    height: 38,
  },
  appliedPromoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: radii.md,
    padding: spacing.sm + 2,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    gap: spacing.sm,
  },
  appliedPromoIconCircle: {
    width: 26,
    height: 26,
    borderRadius: radii.full,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appliedPromoCode: {
    color: colors.text,
    fontSize: 12,
    fontWeight: typography.weights.bold,
  },
  appliedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  appliedBadgeText: {
    color: colors.success,
    fontSize: 8.5,
    fontWeight: typography.weights.bold,
  },
  appliedPromoDesc: {
    color: colors.textSecondary,
    fontSize: 10.5,
    marginTop: 1,
  },
  appliedPromoSavings: {
    color: colors.success,
    fontSize: 11,
    fontWeight: typography.weights.semibold,
    marginTop: 2,
  },
  removePromoBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.xs,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  removePromoText: {
    color: colors.danger,
    fontSize: 10.5,
    fontWeight: typography.weights.bold,
  },
  suggestedVouchersWrap: {
    marginTop: 2,
  },
  suggestedTitle: {
    color: colors.textSecondary,
    fontSize: 10.5,
    marginBottom: 6,
  },
  voucherChipsScroll: {
    flexDirection: 'row',
    gap: 6,
  },
  voucherChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: radii.xs,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  voucherChipCode: {
    color: colors.primaryHover,
    fontSize: 10.5,
    fontWeight: typography.weights.bold,
  },
  voucherChipTitle: {
    color: colors.textSecondary,
    fontSize: 10,
    maxWidth: 130,
  },
  summaryCard: {
    marginTop: spacing.md,
    borderRadius: radii.lg,
    gap: spacing.xs + 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: colors.surfaceElevated,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: 11.5,
    lineHeight: 18,
  },
  summaryValue: {
    color: colors.text,
    fontSize: 11.5,
    fontWeight: typography.weights.medium,
  },
  taxInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  taxInfoText: {
    color: colors.textMuted,
    fontSize: 10,
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 4,
  },
  depositHighlightBox: {
    backgroundColor: 'rgba(0, 102, 255, 0.08)',
    borderRadius: radii.md,
    padding: spacing.sm + 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 255, 0.2)',
  },
  depositRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  depositBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryHover,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  depositBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.5,
  },
  depositSub: {
    color: colors.textMuted,
    fontSize: 9.5,
    marginTop: 3,
  },
  depositAmount: {
    color: colors.primaryHover,
    fontSize: 16,
    fontWeight: typography.weights.bold,
  },
  showroomBalanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  showroomBalanceText: {
    color: colors.textSecondary,
    fontSize: 10.5,
    lineHeight: 14,
    flex: 1,
  },
  noticeBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: radii.sm,
    padding: spacing.sm,
    marginTop: 2,
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
  desktopCheckoutBtn: {
    marginTop: spacing.sm,
  },
  bottomCheckoutBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs + 2,
    paddingBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    gap: spacing.md,
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
    fontSize: typography.sizes.sm + 2,
    fontWeight: typography.weights.bold,
  },
  bottomSavingsSub: {
    color: colors.success,
    fontSize: 9.5,
    fontWeight: typography.weights.semibold,
  },
  checkoutBtn: {
    flex: 1,
    height: 40,
  },
  // Empty State Styling
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 56,
    paddingHorizontal: spacing.lg,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: radii.full,
    backgroundColor: 'rgba(0, 102, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 255, 0.2)',
    position: 'relative',
  },
  emptyIconGlow: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: radii.full,
    backgroundColor: 'rgba(0, 102, 255, 0.15)',
  },
  emptyTitle: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.lg,
    maxWidth: 360,
  },
  emptyActionGroup: {
    width: '100%',
    maxWidth: 320,
    gap: spacing.sm,
  },
  emptyPrimaryBtn: {
    width: '100%',
    height: 42,
  },
  emptySecondaryBtn: {
    width: '100%',
    height: 40,
  },
  quickExploreSection: {
    marginTop: spacing.xl,
    alignItems: 'center',
    width: '100%',
  },
  quickExploreTitle: {
    color: colors.textMuted,
    fontSize: 11,
    marginBottom: spacing.xs + 2,
  },
  quickChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  quickChipText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: typography.weights.medium,
  },
});
