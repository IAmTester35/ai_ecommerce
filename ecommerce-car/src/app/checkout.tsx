import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, radii, spacing, typography, shadows } from '../theme';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';
import { usePaymentStore } from '../store/usePaymentStore';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { formatVndPrice } from '../components/ui/PriceTag';
import { FALLBACK_CAR_URL } from '../constants/images';

export default function CheckoutScreen() {
  const { user, profile } = useAuthStore();
  const { items, getTotalPrice, checkout, isCheckingOut } = useCartStore();
  const { createZaloPayOrder, openZaloPayUrl, isProcessing } = usePaymentStore();

  const [nameInput, setName] = useState<string | null>(null);
  const [phoneInput, setPhone] = useState<string | null>(null);
  const [emailInput, setEmail] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'zalopay' | 'cash'>('zalopay');
  const [agreedTerms, setAgreedTerms] = useState(true);

  const name = nameInput ?? profile?.full_name ?? '';
  const phone = phoneInput ?? profile?.phone ?? '';
  const email = emailInput ?? user?.email ?? '';

  const fallbackImage = FALLBACK_CAR_URL;

  const rawTotal = getTotalPrice();
  // 10% standard deposit
  const depositAmount = Math.round(rawTotal * 0.10);

  const handleProcessPayment = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng điền đầy đủ Họ tên và Số điện thoại nhận xe.');
      return;
    }

    if (!address.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập địa chỉ nhận xe / bàn giao hợp đồng.');
      return;
    }

    if (!agreedTerms) {
      Alert.alert('Điều khoản', 'Vui lòng đồng ý với điều khoản đặt cọc và hợp đồng điện tử.');
      return;
    }

    if (items.length === 0) {
      Alert.alert('Giỏ hàng trống', 'Không có sản phẩm nào để đặt cọc.');
      return;
    }

    try {
      // Step 1: Create Supabase Order
      const orderId = await checkout(user?.id, selectedPaymentMethod);

      if (selectedPaymentMethod === 'zalopay') {
        // Step 2: Build ZaloPay payload
        const paymentItems = items.map((item) => ({
          id: item.car_id,
          name: item.car ? `${item.car.make} ${item.car.model}` : 'Xe ô tô AutoMatch',
          price: Math.round((item.car?.price || 0) * 0.10),
          itemCount: item.quantity,
        }));

        const payload = {
          order_id: orderId,
          amount: depositAmount,
          items: paymentItems,
          email,
          address,
          name,
          phone,
          note,
          userid: user?.id || 'guest',
        };

        // Step 3: Call FastAPI ZaloPay payment create API
        const response = await createZaloPayOrder(payload);

        if (response.return_code === 1 && response.order_url) {
          await openZaloPayUrl(response.order_url);
        } else {
          Alert.alert(
            'Thông báo ZaloPay',
            response.return_message || 'Đã khởi tạo giao dịch ZaloPay Sandbox.'
          );
        }

        router.replace({
          pathname: `/order/${orderId}`,
          params: { app_trans_id: response.app_trans_id || '' },
        } as any);
      } else {
        // Direct / Transfer deposit
        Alert.alert(
          'Đã tiếp nhận đơn hàng',
          `Đơn hàng #${orderId} đã được ghi nhận. Đội ngũ AutoMatch sẽ liên hệ theo số ${phone} để hoàn tất thủ tục bàn giao.`
        );
        router.replace(`/order/${orderId}` as any);
      }
    } catch (err: any) {
      Alert.alert('Lỗi thanh toán', err.message || 'Có lỗi xảy ra trong quá trình xử lý.');
    }
  };

  const isLoading = isCheckingOut || isProcessing;

  return (
    <View style={styles.screen}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Xác Nhận Đặt Cọc</Text>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Items Summary Header */}
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="car-outline" size={15} color={colors.primaryHover} style={{ marginRight: 6 }} />
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
                Niêm yết: {formatVndPrice(item.car?.price)}
              </Text>
            </View>
          </Card>
        ))}

        {/* Deposit Summary Box */}
        <View style={styles.totalBox}>
          <View>
            <Text style={styles.totalLabel}>Tiền đặt cọc giữ xe (10%):</Text>
            <Text style={styles.totalSub}>Bao gồm hợp đồng điện tử & bảo lưu giá</Text>
          </View>
          <Text style={styles.totalAmount}>{formatVndPrice(depositAmount)}</Text>
        </View>

        {/* Delivery / Pickup Address */}
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="location-outline" size={15} color={colors.primaryHover} style={{ marginRight: 6 }} />
          <Text style={styles.sectionTitle}>Địa chỉ giao nhận xe</Text>
        </View>
        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Địa chỉ giao xe / nhận hợp đồng *</Text>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="Số nhà, Tên đường, Quận/Huyện, Tỉnh/TP"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </View>

        {/* Guest Banner */}
        {!user && (
          <View style={styles.guestBanner}>
            <Ionicons name="information-circle-outline" size={16} color={colors.primaryHover} style={{ marginRight: 6 }} />
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

        {/* Customer Information Form */}
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="person-outline" size={15} color={colors.primaryHover} style={{ marginRight: 6 }} />
          <Text style={styles.sectionTitle}>Thông tin người đặt</Text>
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
              placeholder="Yêu cầu thêm về thời gian, bàn giao..."
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </View>

        {/* Payment Method Options */}
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="card-outline" size={15} color={colors.primaryHover} style={{ marginRight: 6 }} />
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
              <Ionicons name="qr-code-outline" size={18} color="#0088FF" />
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
            <Ionicons name="checkmark-circle" size={18} color={colors.primaryHover} />
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
              <Ionicons name="business-outline" size={18} color={colors.textSecondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.paymentOptionTitle}>Thanh toán tại Showroom</Text>
              <Text style={styles.paymentOptionSub}>
                Chuyển khoản hoặc tiền mặt tại quầy giao dịch AutoMatch
              </Text>
            </View>
          </View>
          {selectedPaymentMethod === 'cash' && (
            <Ionicons name="checkmark-circle" size={18} color={colors.primaryHover} />
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
            size={16}
            color={colors.primaryHover}
          />
          <Text style={styles.termsText}>
            Tôi đồng ý với Điều khoản đặt cọc và chính sách bảo mật hợp đồng mua bán xe điện tử của AutoMatch.
          </Text>
        </TouchableOpacity>

        {/* Submit Payment Button */}
        <View style={styles.actionSection}>
          <Button
            title={
              selectedPaymentMethod === 'zalopay'
                ? `Thanh toán cọc ${formatVndPrice(depositAmount)} qua ZaloPay`
                : `Xác nhận đặt cọc ${formatVndPrice(depositAmount)}`
            }
            onPress={handleProcessPayment}
            loading={isLoading}
            disabled={isLoading}
            icon={<Ionicons name="shield-checkmark-outline" size={16} color="#FFFFFF" />}
            style={styles.submitBtn}
            size="md"
          />
        </View>
      </ScrollView>
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
    paddingTop: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xs + 2,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.sizes.xs + 2,
    fontWeight: typography.weights.semibold,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs + 2,
  },
  itemImage: {
    width: 60,
    height: 44,
    borderRadius: radii.xs,
    marginRight: spacing.sm + 2,
  },
  itemDetails: {
    flex: 1,
  },
  itemTitle: {
    color: colors.text,
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.semibold,
  },
  itemYear: {
    color: colors.textMuted,
    fontSize: typography.sizes['2xs'],
    marginTop: 1,
  },
  itemPrice: {
    color: colors.primaryHover,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    marginTop: 1,
  },
  totalBox: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: spacing.sm + 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs + 2,
    ...shadows.sm,
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
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  formCard: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: spacing.sm + 2,
    gap: spacing.sm,
  },
  inputGroup: {
    gap: 3,
  },
  label: {
    color: colors.textSecondary,
    fontSize: typography.sizes['2xs'] + 1,
    fontWeight: typography.weights.medium,
  },
  input: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.xs,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 7,
    color: colors.text,
    fontSize: typography.sizes.xs,
  },
  textArea: {
    height: 60,
    textAlignVertical: 'top',
  },
  paymentOptionCard: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: spacing.sm + 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs + 2,
  },
  paymentOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
  },
  paymentOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    marginRight: spacing.sm,
  },
  paymentIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentOptionTitle: {
    color: colors.text,
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.semibold,
  },
  paymentOptionSub: {
    color: colors.textMuted,
    fontSize: typography.sizes['2xs'],
    marginTop: 1,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs + 2,
    marginTop: spacing.sm + 2,
    marginBottom: spacing.xs,
  },
  termsText: {
    color: colors.textSecondary,
    fontSize: typography.sizes['2xs'] + 1,
    lineHeight: 16,
    flex: 1,
  },
  actionSection: {
    marginTop: spacing.md,
    marginBottom: 40,
  },
  submitBtn: {
    height: 42,
  },
  guestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderColor: 'rgba(59, 130, 246, 0.25)',
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  guestBannerText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    flex: 1,
    lineHeight: 16,
  },
  guestBannerLink: {
    color: colors.primaryHover,
    fontWeight: typography.weights.bold,
  },
});


