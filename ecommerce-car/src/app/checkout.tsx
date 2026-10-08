import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '../theme';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';
import { usePaymentStore } from '../store/usePaymentStore';
import { useShowroomStore } from '../store/useShowroomStore';
import { useVoucherStore } from '../store/useVoucherStore';
import { globalAlert } from '../store/useDialogStore';
import { useResponsive } from '../hooks/useResponsive';
import { ResponsiveContainer } from '../components/ui/ResponsiveContainer';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { formatVnd, formatVndPrice, usdToVnd } from '../utils/currency';
import { FALLBACK_CAR_URL } from '../constants/images';
import { Showroom, Voucher } from '../types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuthStore();
  const { items, checkout, isCheckingOut } = useCartStore();
  const { createZaloPayOrder, openZaloPayUrl, isProcessing } = usePaymentStore();
  const { showrooms, selectedShowroom, fetchShowrooms, selectShowroom } = useShowroomStore();
  const {
    vouchers,
    appliedVoucher,
    discountAmount,
    fetchVouchers,
    applyVoucherByCode,
    applyVoucherDirectly,
    removeVoucher,
    recalculateDiscount,
  } = useVoucherStore();
  const { isLargeScreen } = useResponsive();

  const [name, setName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [note, setNote] = useState('');
  const [voucherInput, setVoucherInput] = useState('');
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'zalopay' | 'cash'>('zalopay');
  const [agreedTerms, setAgreedTerms] = useState(false);

  const fallbackImage = FALLBACK_CAR_URL;

  // 1. Fetch Showrooms & Vouchers on Mount
  useEffect(() => {
    fetchShowrooms().then((loadedShowrooms) => {
      // If cart item already has showroom_id, prefer that showroom
      const carShowroomId = items.find((i) => i.car?.showroom_id)?.car?.showroom_id;
      if (carShowroomId && loadedShowrooms.length > 0) {
        const matched = loadedShowrooms.find((s) => s.id === carShowroomId);
        if (matched) {
          selectShowroom(matched);
        }
      }
    });
    fetchVouchers();
  }, [fetchShowrooms, fetchVouchers, items, selectShowroom]);

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

  // Recalculate voucher discount when items change
  useEffect(() => {
    recalculateDiscount(rawTotalVnd);
  }, [rawTotalVnd, recalculateDiscount]);

  const netTotalVnd = Math.max(0, rawTotalVnd - discountAmount);
  // Standard 10% deposit
  const depositAmountVnd = Math.round(netTotalVnd * 0.10);
  // Remaining 90% amount to pay at Showroom
  const remainingAmountVnd = Math.max(0, netTotalVnd - depositAmountVnd);

  const handleApplyVoucher = async (codeToApply?: string) => {
    const code = (codeToApply || voucherInput).trim();
    if (!code) {
      globalAlert('Thông báo', 'Vui lòng nhập mã ưu đãi.');
      return;
    }

    setIsApplyingVoucher(true);
    const result = await applyVoucherByCode(code, rawTotalVnd);
    setIsApplyingVoucher(false);

    if (result.success) {
      setVoucherInput('');
      globalAlert('Thành công', result.message || 'Đã áp dụng mã ưu đãi thành công!');
    } else {
      globalAlert('Mã không hợp lệ', result.message || 'Mã ưu đãi không áp dụng được cho đơn này.');
    }
  };

  const handleProcessPayment = async () => {
    if (!user) {
      globalAlert(
        'Yêu Cầu Đăng Nhập',
        'Vui lòng đăng nhập tài khoản để tiến hành đặt cọc và xác lập hợp đồng điện tử.',
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Đăng nhập',
            onPress: () => router.push('/(auth)/login' as any),
          },
        ]
      );
      return;
    }

    if (!name.trim() || !phone.trim()) {
      globalAlert('Thiếu thông tin', 'Vui lòng điền đầy đủ Họ tên và Số điện thoại nhận xe.');
      return;
    }

    if (!agreedTerms) {
      globalAlert('Điều khoản', 'Vui lòng đồng ý với điều khoản đặt cọc và hợp đồng điện tử.');
      return;
    }

    if (items.length === 0) {
      globalAlert('Giỏ hàng trống', 'Không có sản phẩm nào để đặt cọc.');
      return;
    }

    try {
      // Step 1: Create Supabase Order via checkout_cart RPC
      const orderId = await checkout(
        user.id,
        selectedPaymentMethod,
        selectedShowroom?.id,
        appliedVoucher?.code,
        0.10
      );

      if (selectedPaymentMethod === 'zalopay') {
        // Step 2: Build ZaloPay payload with deposit prices
        const paymentItems = items.map((item) => {
          const itemPriceVnd = usdToVnd(item.car?.price || 0, {
            engineHp: item.car?.engine_hp,
            fuelType: item.car?.metadata?.engine_fuel_type || item.car?.metadata?.fuel_type,
          });
          return {
            id: item.car_id,
            name: item.car ? `${item.car.make} ${item.car.model} (Cọc 10%)` : 'Xe ô tô AutoMatch (Cọc 10%)',
            price: Math.round(itemPriceVnd * 0.10),
            itemCount: item.quantity,
          };
        });

        const payload = {
          order_id: orderId,
          amount: depositAmountVnd,
          items: paymentItems,
          email,
          address: selectedShowroom?.address || '',
          name,
          phone,
          note: `${note ? note + ' | ' : ''}Showroom nhận xe: ${selectedShowroom?.name || 'Tùy chọn'}`,
          userid: user?.id || 'guest',
        };

        // Step 3: Call FastAPI ZaloPay payment create API
        try {
          const response = await createZaloPayOrder(payload);

          if (response.return_code === 1 && response.order_url) {
            await openZaloPayUrl(response.order_url);
          } else {
            globalAlert(
              'Thông báo ZaloPay',
              response.return_message || 'Đã khởi tạo giao dịch ZaloPay Sandbox.'
            );
          }

          router.replace({
            pathname: `/order/${orderId}`,
            params: { app_trans_id: response.app_trans_id || '' },
          } as any);
        } catch (zaloErr: any) {
          console.warn('[checkout] ZaloPay payment gateway error:', zaloErr);
          globalAlert(
            'Đã tạo đơn đặt cọc',
            `Đơn hàng #${orderId.slice(0, 8).toUpperCase()} đã được tạo thành công trên hệ thống. Cổng thanh toán ZaloPay trực tuyến tạm thời gián đoạn. Bạn có thể chuyển khoản trực tiếp hoặc theo dõi tiến độ đơn hàng.`,
            [
              {
                text: 'Xem đơn hàng',
                onPress: () => router.replace(`/order/${orderId}` as any),
              },
            ]
          );
        }
      } else {
        // Direct / Transfer deposit
        globalAlert(
          'Đã tiếp nhận đơn hàng',
          `Đơn hàng #${orderId.slice(0, 8).toUpperCase()} đã được ghi nhận. Showroom ${selectedShowroom?.name || 'AutoMatch'} sẽ liên hệ theo số ${phone} để hoàn tất thủ tục bàn giao.`
        );
        router.replace(`/order/${orderId}` as any);
      }
    } catch (err: any) {
      globalAlert('Lỗi đặt cọc', err.message || 'Có lỗi xảy ra trong quá trình xử lý.');
    }
  };

  const isButtonLoading = isCheckingOut || isProcessing;

  const renderOrderSummaryBlock = () => (
    <Card style={styles.summarySidebarCard} padding={spacing.md}>
      <View style={styles.sectionHeaderRow}>
        <Ionicons name="car-outline" size={15} color={colors.primaryHover} style={{ marginRight: 5 }} />
        <Text style={styles.sectionTitle}>Sản phẩm đặt cọc ({items.length})</Text>
      </View>

      {items.map((item) => (
        <View key={item.id} style={styles.itemCard}>
          <Image
            source={{ uri: item.car?.image_url || fallbackImage }}
            style={styles.itemImage}
            contentFit="cover"
          />
          <View style={styles.itemDetails}>
            <Text style={styles.itemTitle} numberOfLines={1}>
              {item.car ? `${item.car.make} ${item.car.model}` : 'Mẫu xe AutoMatch'}
            </Text>
            <Text style={styles.itemYear}>Năm {item.car?.year || 2024} • x{item.quantity} xe</Text>
            <Text style={styles.itemPrice}>
              Niêm yết: {formatVndPrice(item.car?.price, 'usd', {
                engineHp: item.car?.engine_hp,
                fuelType: item.car?.metadata?.engine_fuel_type || item.car?.metadata?.fuel_type,
              })}
            </Text>
          </View>
        </View>
      ))}

      {/* Financial Breakdown Table */}
      <View style={styles.financialBox}>
        <View style={styles.financialRow}>
          <Text style={styles.financialLabel}>Tổng giá trị niêm yết:</Text>
          <Text style={styles.financialValue}>{formatVnd(rawTotalVnd)}</Text>
        </View>

        {discountAmount > 0 && (
          <View style={styles.financialRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="pricetag" size={12} color={colors.success} />
              <Text style={[styles.financialLabel, { color: colors.success }]}>
                Ưu đãi ({appliedVoucher?.code}):
              </Text>
            </View>
            <Text style={[styles.financialValue, { color: colors.success }]}>
              -{formatVnd(discountAmount)}
            </Text>
          </View>
        )}

        <View style={styles.financialDivider} />

        <View style={styles.financialRow}>
          <Text style={styles.financialLabelBold}>Tổng giá trị sau ưu đãi:</Text>
          <Text style={styles.financialValueBold}>{formatVnd(netTotalVnd)}</Text>
        </View>

        {/* Highlight Online Deposit vs Showroom Settlement */}
        <View style={styles.depositHighlightCard}>
          <View style={styles.depositHeaderRow}>
            <View style={styles.depositBadge}>
              <Text style={styles.depositBadgeText}>THANH TOÁN ONLINE (10%)</Text>
            </View>
            <Text style={styles.depositAmountText}>{formatVnd(depositAmountVnd)}</Text>
          </View>
          <Text style={styles.depositSubText}>
            Tiền đặt cọc giữ xe & xác lập hợp đồng điện tử trực tuyến.
          </Text>
        </View>

        <View style={styles.showroomSettlementRow}>
          <Ionicons name="business-outline" size={13} color={colors.textMuted} />
          <Text style={styles.showroomSettlementText}>
            Còn lại <Text style={{ color: colors.text, fontWeight: '700' }}>{formatVnd(remainingAmountVnd)}</Text> thanh toán tại Showroom khi nhận xe.
          </Text>
        </View>
      </View>

      {/* Selected Showroom Pill */}
      {selectedShowroom && (
        <View style={styles.showroomSidebarPill}>
          <Ionicons name="location-sharp" size={13} color={colors.primaryHover} />
          <View style={{ flex: 1 }}>
            <Text style={styles.showroomSidebarTitle} numberOfLines={1}>
              {selectedShowroom.name}
            </Text>
            <Text style={styles.showroomSidebarAddr} numberOfLines={1}>
              {selectedShowroom.address}
            </Text>
          </View>
        </View>
      )}

      {/* Security Note */}
      <View style={styles.securityBox}>
        <Ionicons name="shield-checkmark-outline" size={14} color={colors.success} />
        <Text style={styles.securityText}>
          Giao dịch được bảo hộ 100% qua hợp đồng điện tử AutoMatch.
        </Text>
      </View>

      {/* Action Button inside Sidebar */}
      <Button
        title={
          selectedPaymentMethod === 'zalopay'
            ? `Thanh toán cọc ${formatVnd(depositAmountVnd)} qua ZaloPay`
            : `Xác nhận đặt cọc ${formatVnd(depositAmountVnd)}`
        }
        onPress={handleProcessPayment}
        loading={isButtonLoading}
        disabled={isButtonLoading}
        icon={<Ionicons name="shield-checkmark-outline" size={14} color="#FFFFFF" />}
        style={styles.submitBtn}
        size="md"
      />
    </Card>
  );

  return (
    <View style={styles.screen}>
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 44) }]}>
        <View style={styles.headerInner}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={16} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Xác Nhận Đặt Cọc Xe</Text>
        </View>
      </View>

      <ResponsiveContainer scrollable maxWidth="xl" showsVerticalScrollIndicator={false}>
        <View style={[styles.checkoutLayout, isLargeScreen && styles.checkoutLayoutSplit]}>
          {/* Left Column / Forms */}
          <View style={[styles.formsColumn, isLargeScreen && styles.formsColumnSplit]}>
            {/* On Mobile: Render items summary at top */}
            {!isLargeScreen && (
              <>
                <View style={styles.sectionHeaderRow}>
                  <Ionicons name="car-outline" size={14} color={colors.primaryHover} style={{ marginRight: 5 }} />
                  <Text style={styles.sectionTitle}>Sản phẩm đặt cọc ({items.length})</Text>
                </View>

                {items.map((item) => (
                  <Card key={item.id} style={styles.itemCard} padding={spacing.sm}>
                    <Image
                      source={{ uri: item.car?.image_url || fallbackImage }}
                      style={styles.itemImage}
                      contentFit="cover"
                    />
                    <View style={styles.itemDetails}>
                      <Text style={styles.itemTitle} numberOfLines={1}>
                        {item.car ? `${item.car.make} ${item.car.model}` : 'Mẫu xe AutoMatch'}
                      </Text>
                      <Text style={styles.itemYear}>Năm {item.car?.year || 2024} • x{item.quantity} xe</Text>
                      <Text style={styles.itemPrice}>
                        Niêm yết: {formatVndPrice(item.car?.price, 'usd', {
                          engineHp: item.car?.engine_hp,
                          fuelType: item.car?.metadata?.engine_fuel_type || item.car?.metadata?.fuel_type,
                        })}
                      </Text>
                    </View>
                  </Card>
                ))}
              </>
            )}

            {/* Guest Banner */}
            {!user && (
              <View style={styles.guestBanner}>
                <Ionicons name="information-circle-outline" size={14} color={colors.primaryHover} style={{ marginRight: 5 }} />
                <Text style={styles.guestBannerText}>
                  Bạn đang đặt cọc với tư cách Khách.{' '}
                  <Text
                    style={styles.guestBannerLink}
                    onPress={() => router.push('/(auth)/login' as any)}
                  >
                    Đăng nhập ngay
                  </Text>
                </Text>
              </View>
            )}

            {/* 1. Showroom Selection Section */}
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="business-outline" size={14} color={colors.primaryHover} style={{ marginRight: 5 }} />
              <Text style={styles.sectionTitle}>Showroom Nhận Xe & Ký Hợp Đồng</Text>
            </View>
            <View style={styles.formCard}>
              <Text style={styles.fieldHint}>
                Chọn chi nhánh Showroom tiện nhất để hoàn tất hồ sơ và nhận bàn giao xe thực tế:
              </Text>

              {showrooms.length === 0 ? (
                <Text style={styles.emptyNote}>Đang tải danh sách showroom...</Text>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.showroomScroll}>
                  {showrooms.map((sr) => {
                    const isSelected = selectedShowroom?.id === sr.id;
                    return (
                      <TouchableOpacity
                        key={sr.id}
                        activeOpacity={0.85}
                        style={[
                          styles.showroomOptionCard,
                          isSelected && styles.showroomOptionSelected,
                        ]}
                        onPress={() => selectShowroom(sr)}
                      >
                        <View style={styles.showroomHeader}>
                          <Badge
                            label={sr.city}
                            variant={isSelected ? 'primary' : 'neutral'}
                            size="xs"
                          />
                          {isSelected && (
                            <Ionicons name="checkmark-circle" size={16} color={colors.primaryHover} />
                          )}
                        </View>
                        <Text style={styles.showroomName} numberOfLines={2}>
                          {sr.name}
                        </Text>
                        <Text style={styles.showroomAddress} numberOfLines={2}>
                          {sr.address}
                        </Text>
                        <View style={styles.showroomMetaRow}>
                          <Ionicons name="call-outline" size={10} color={colors.textMuted} />
                          <Text style={styles.showroomMetaText}>{sr.phone || '1900 8888'}</Text>
                        </View>
                        <View style={styles.showroomMetaRow}>
                          <Ionicons name="time-outline" size={10} color={colors.textMuted} />
                          <Text style={styles.showroomMetaText}>{sr.opening_hours || '08:00 - 20:00'}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>

            {/* 2. Voucher & Promotion Code Section */}
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="gift-outline" size={14} color={colors.primaryHover} style={{ marginRight: 5 }} />
              <Text style={styles.sectionTitle}>Mã Ưu Đãi & Khuyến Mãi</Text>
            </View>
            <View style={styles.formCard}>
              <View style={styles.voucherInputRow}>
                <TextInput
                  style={[styles.input, styles.voucherInput]}
                  value={voucherInput}
                  onChangeText={(val) => setVoucherInput(val.toUpperCase())}
                  placeholder="Nhập mã ưu đãi (vd: WELCOME10M)"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="characters"
                />
                <Button
                  title={isApplyingVoucher ? '...' : 'Áp dụng'}
                  size="sm"
                  variant="primary"
                  onPress={() => handleApplyVoucher()}
                  loading={isApplyingVoucher}
                  style={styles.applyBtn}
                />
              </View>

              {/* Applied Voucher Banner */}
              {appliedVoucher && (
                <View style={styles.appliedVoucherBox}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.appliedVoucherTitle}>
                      Mã: {appliedVoucher.code} ({appliedVoucher.title})
                    </Text>
                    <Text style={styles.appliedVoucherSub}>
                      Tiết kiệm {formatVnd(discountAmount)} cho đơn hàng này.
                    </Text>
                  </View>
                  <TouchableOpacity onPress={removeVoucher} style={styles.removeVoucherBtn}>
                    <Text style={styles.removeVoucherText}>Gỡ bỏ</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Suggested Vouchers Quick Chips */}
              {vouchers.length > 0 && !appliedVoucher && (
                <View style={styles.suggestedVouchersWrap}>
                  <Text style={styles.suggestedTitle}>Ưu đãi khả dụng:</Text>
                  <View style={styles.voucherChipsList}>
                    {vouchers.map((v) => (
                      <TouchableOpacity
                        key={v.id}
                        style={styles.voucherChip}
                        onPress={() => handleApplyVoucher(v.code)}
                      >
                        <Ionicons name="pricetag-outline" size={11} color={colors.primaryHover} />
                        <Text style={styles.voucherChipCode}>{v.code}</Text>
                        <Text style={styles.voucherChipDesc} numberOfLines={1}>
                          • {v.title}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* 3. Customer Information Form */}
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="person-outline" size={14} color={colors.primaryHover} style={{ marginRight: 5 }} />
              <Text style={styles.sectionTitle}>Thông tin người đặt cọc</Text>
            </View>
            <View style={styles.formCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Họ và tên chủ xe *</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Nguyễn Văn A"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Số điện thoại liên hệ *</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholder="0901234567"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email nhận hợp đồng điện tử *</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  placeholder="khachhang@example.com"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Ghi chú đơn hàng</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={note}
                  onChangeText={setNote}
                  multiline
                  numberOfLines={3}
                  placeholder="Yêu cầu thêm về màu nội thất, ngày nhận xe..."
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            {/* 4. Payment Method Options */}
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="card-outline" size={14} color={colors.primaryHover} style={{ marginRight: 5 }} />
              <Text style={styles.sectionTitle}>Phương thức thanh toán cọc</Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.paymentOptionCard,
                selectedPaymentMethod === 'zalopay' && styles.paymentOptionSelected,
              ]}
              onPress={() => setSelectedPaymentMethod('zalopay')}
            >
              <View style={styles.paymentOptionHeader}>
                <View style={styles.paymentIconCircle}>
                  <Ionicons name="qr-code-outline" size={16} color="#0088FF" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.paymentOptionTitle}>ZaloPay Gateway (Trực tuyến)</Text>
                    <Badge label="Khuyên dùng" variant="primary" size="xs" />
                  </View>
                  <Text style={styles.paymentOptionSub}>
                    QR ZaloPay / Thẻ ATM Nội địa / VISA, Mastercard
                  </Text>
                </View>
              </View>
              {selectedPaymentMethod === 'zalopay' && (
                <Ionicons name="checkmark-circle" size={16} color={colors.primaryHover} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.paymentOptionCard,
                selectedPaymentMethod === 'cash' && styles.paymentOptionSelected,
              ]}
              onPress={() => setSelectedPaymentMethod('cash')}
            >
              <View style={styles.paymentOptionHeader}>
                <View style={styles.paymentIconCircle}>
                  <Ionicons name="wallet-outline" size={16} color={colors.textSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.paymentOptionTitle}>Chuyển khoản trực tiếp</Text>
                  <Text style={styles.paymentOptionSub}>
                    Chuyển khoản đặt cọc qua số tài khoản chính thức của AutoMatch
                  </Text>
                </View>
              </View>
              {selectedPaymentMethod === 'cash' && (
                <Ionicons name="checkmark-circle" size={16} color={colors.primaryHover} />
              )}
            </TouchableOpacity>

            {/* Terms Checkbox */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.termsRow}
              onPress={() => setAgreedTerms(!agreedTerms)}
            >
              <Ionicons
                name={agreedTerms ? 'checkbox' : 'square-outline'}
                size={15}
                color={colors.primaryHover}
              />
              <Text style={styles.termsText}>
                Tôi đồng ý với Điều khoản đặt cọc 10% và chính sách bảo mật hợp đồng mua bán xe điện tử của AutoMatch.
              </Text>
            </TouchableOpacity>

            {/* On Mobile: Action Button at bottom of form */}
            {!isLargeScreen && (
              <View style={styles.actionSection}>
                <View style={styles.mobileFinancialBox}>
                  <View style={styles.financialRow}>
                    <Text style={styles.financialLabel}>Tổng giá trị xe:</Text>
                    <Text style={styles.financialValue}>{formatVnd(netTotalVnd)}</Text>
                  </View>
                  <View style={styles.financialRow}>
                    <Text style={styles.depositLabelBold}>Tiền đặt cọc online (10%):</Text>
                    <Text style={styles.depositAmountBold}>{formatVnd(depositAmountVnd)}</Text>
                  </View>
                </View>

                <Button
                  title={
                    selectedPaymentMethod === 'zalopay'
                      ? `Thanh toán cọc ${formatVnd(depositAmountVnd)} qua ZaloPay`
                      : `Xác nhận đặt cọc ${formatVnd(depositAmountVnd)}`
                  }
                  onPress={handleProcessPayment}
                  loading={isButtonLoading}
                  disabled={isButtonLoading}
                  icon={<Ionicons name="shield-checkmark-outline" size={14} color="#FFFFFF" />}
                  style={styles.submitBtn}
                  size="md"
                />
              </View>
            )}
          </View>

          {/* Right Column / Sticky Summary on Desktop */}
          {isLargeScreen && (
            <View style={styles.sidebarColumnSplit}>
              {renderOrderSummaryBlock()}
            </View>
          )}
        </View>

        <View style={{ height: Math.max(insets.bottom + 20, 40) }} />
      </ResponsiveContainer>
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
  checkoutLayout: {
    width: '100%',
    paddingTop: spacing.xs,
  },
  checkoutLayoutSplit: {
    flexDirection: 'row',
    gap: spacing.xl,
    alignItems: 'flex-start',
    marginTop: spacing.md,
  },
  formsColumn: {
    width: '100%',
  },
  formsColumnSplit: {
    flex: 1.35,
  },
  sidebarColumnSplit: {
    flex: 1,
    position: 'sticky' as any,
    top: 20,
  },
  summarySidebarCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.semibold,
    lineHeight: 18,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  itemImage: {
    width: 60,
    height: 42,
    borderRadius: radii.xs,
    marginRight: spacing.sm,
  },
  itemDetails: {
    flex: 1,
  },
  itemTitle: {
    color: colors.text,
    fontSize: 11,
    fontWeight: typography.weights.semibold,
    lineHeight: 15,
  },
  itemYear: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 1,
  },
  itemPrice: {
    color: colors.primaryHover,
    fontSize: 11,
    fontWeight: typography.weights.bold,
    marginTop: 1,
  },
  formCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  fieldHint: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
  emptyNote: {
    color: colors.textMuted,
    fontSize: 11,
    fontStyle: 'italic',
  },
  showroomScroll: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  showroomOptionCard: {
    width: 220,
    backgroundColor: colors.background,
    borderRadius: radii.sm,
    padding: spacing.sm,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 4,
  },
  showroomOptionSelected: {
    borderColor: colors.primaryHover,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
  },
  showroomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  showroomName: {
    color: colors.text,
    fontSize: 11,
    fontWeight: typography.weights.semibold,
    lineHeight: 15,
  },
  showroomAddress: {
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 14,
  },
  showroomMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  showroomMetaText: {
    color: colors.textSecondary,
    fontSize: 9,
  },
  showroomSidebarPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    borderRadius: radii.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  showroomSidebarTitle: {
    color: colors.primaryHover,
    fontSize: 11,
    fontWeight: typography.weights.semibold,
  },
  showroomSidebarAddr: {
    color: colors.textMuted,
    fontSize: 10,
  },
  voucherInputRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
  },
  voucherInput: {
    flex: 1,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  applyBtn: {
    height: 40,
    paddingHorizontal: spacing.md,
  },
  appliedVoucherBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: radii.sm,
    padding: spacing.sm,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  appliedVoucherTitle: {
    color: colors.success,
    fontSize: 11,
    fontWeight: typography.weights.semibold,
  },
  appliedVoucherSub: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 1,
  },
  removeVoucherBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  removeVoucherText: {
    color: colors.danger,
    fontSize: 10,
    fontWeight: typography.weights.medium,
  },
  suggestedVouchersWrap: {
    marginTop: spacing.xs,
    gap: 4,
  },
  suggestedTitle: {
    color: colors.textMuted,
    fontSize: 10,
  },
  voucherChipsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  voucherChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  voucherChipCode: {
    color: colors.primaryHover,
    fontSize: 10,
    fontWeight: typography.weights.bold,
  },
  voucherChipDesc: {
    color: colors.textMuted,
    fontSize: 9,
    maxWidth: 120,
  },
  financialBox: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.sm + 2,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  financialLabel: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  financialValue: {
    color: colors.text,
    fontSize: 11,
    fontWeight: typography.weights.medium,
  },
  financialLabelBold: {
    color: colors.text,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  financialValueBold: {
    color: colors.text,
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.bold,
  },
  financialDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 2,
  },
  depositHighlightCard: {
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    borderRadius: radii.sm,
    padding: spacing.sm,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.35)',
  },
  depositHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  depositBadge: {
    backgroundColor: colors.primaryHover,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.xs,
  },
  depositBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: typography.weights.bold,
  },
  depositAmountText: {
    color: colors.primaryHover,
    fontSize: typography.sizes.sm + 1,
    fontWeight: typography.weights.bold,
  },
  depositSubText: {
    color: colors.textSecondary,
    fontSize: 9.5,
    marginTop: 3,
  },
  showroomSettlementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  showroomSettlementText: {
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 14,
  },
  mobileFinancialBox: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.sm,
    padding: spacing.sm,
    marginBottom: spacing.xs,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  depositLabelBold: {
    color: colors.primaryHover,
    fontSize: 11,
    fontWeight: typography.weights.bold,
  },
  depositAmountBold: {
    color: colors.primaryHover,
    fontSize: 13,
    fontWeight: typography.weights.bold,
  },
  securityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: radii.sm,
    padding: spacing.sm,
    marginVertical: spacing.xs,
  },
  securityText: {
    color: colors.textSecondary,
    fontSize: 10,
    flex: 1,
  },
  inputGroup: {
    gap: 3,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: typography.weights.medium,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 0,
    height: 40,
    color: colors.text,
    fontSize: typography.sizes.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  textArea: {
    height: 65,
    paddingVertical: 8,
    textAlignVertical: 'top',
  },
  paymentOptionCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    padding: spacing.sm + 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs + 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  paymentOptionSelected: {
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    borderColor: 'rgba(59, 130, 246, 0.35)',
  },
  paymentOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    marginRight: spacing.xs,
  },
  paymentIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentOptionTitle: {
    color: colors.text,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    lineHeight: 18,
  },
  paymentOptionSub: {
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 14,
    marginTop: 1,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  termsText: {
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 15,
    flex: 1,
  },
  actionSection: {
    marginTop: spacing.md,
    marginBottom: 40,
  },
  submitBtn: {
    height: 42,
    marginTop: spacing.xs,
  },
  guestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  guestBannerText: {
    color: colors.textSecondary,
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },
  guestBannerLink: {
    color: colors.primaryHover,
    fontWeight: typography.weights.bold,
  },
});
