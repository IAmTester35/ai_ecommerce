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
export default function CheckoutScreen() {
  const { user, profile } = useAuthStore();
  const { items, getTotalPrice, checkout, isCheckingOut } = useCartStore();
  const { createZaloPayOrder, openZaloPayUrl, isProcessing } = usePaymentStore();

  const [nameInput, setName] = useState<string | null>(null);
  const [phoneInput, setPhone] = useState<string | null>(null);
  const [emailInput, setEmail] = useState<string | null>(null);
  const [address, setAddress] = useState('68 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM');
  const [note, setNote] = useState('Thanh toán tiền đặt cọc giữ xe chính hãng AutoMatch');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'zalopay' | 'cash'>('zalopay');
  const [agreedTerms, setAgreedTerms] = useState(true);

  const name = nameInput ?? profile?.full_name ?? 'Khách Hàng VIP';
  const phone = phoneInput ?? profile?.phone ?? '0908889999';
  const email = emailInput ?? user?.email ?? 'khachhang.vip@automatch.ai';

  const fallbackImage =
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=800';

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
            'Thông Báo ZaloPay',
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
          'Đã Tiếp Nhận Đơn Hàng! 🚗',
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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Items Summary Header */}
      <Text style={styles.sectionTitle}>🚗 Sản Phẩm Đặt Cọc ({items.length})</Text>
      {items.map((item) => (
        <Card key={item.id} style={styles.itemCard}>
          <Image
            source={{ uri: item.car?.image_url || fallbackImage }}
            style={styles.itemImage}
            contentFit="cover"
          />
          <View style={styles.itemDetails}>
            <Text style={styles.itemTitle} numberOfLines={1}>
              {item.car ? `${item.car.make} ${item.car.model}` : 'Mẫu xe AutoMatch'}
            </Text>
            <Text style={styles.itemYear}>Phiên bản {item.car?.year || 2024} • x{item.quantity} xe</Text>
            <Text style={styles.itemPrice}>
              Giá niêm yết: {formatVndPrice(item.car?.price)}
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
      <Text style={styles.sectionTitle}>📍 Địa Chỉ Nhận Xe & Bàn Giao Hợp Đồng</Text>
      <View style={styles.formCard}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Địa chỉ giao xe / nhận hợp đồng *</Text>
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            placeholder="Số nhà, Tên đường, Phường/Xã, Quận/Huyện, Tỉnh/TP"
            placeholderTextColor={colors.textMuted}
          />
        </View>
      </View>

      {/* Customer Information Form */}
      <Text style={styles.sectionTitle}>👤 Thông Tin Người Đặt Xe</Text>
      <View style={styles.formCard}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Họ và Tên chủ xe *</Text>
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
            placeholder="Ghi chú yêu cầu thêm..."
            placeholderTextColor={colors.textMuted}
          />
        </View>
      </View>

      {/* Payment Method Options */}
      <Text style={styles.sectionTitle}>💳 Phương Thức Thanh Toán Đặt Cọc</Text>

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
            <Ionicons name="qr-code-outline" size={22} color="#0088FF" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.paymentOptionTitle}>ZaloPay Gateway (Trực tuyến)</Text>
              <Badge label="Khuyên Dùng" variant="primary" size="xs" />
            </View>
            <Text style={styles.paymentOptionSub}>
              Quét mã QR ZaloPay / Thẻ ATM Nội địa / Thẻ Quốc tế VISA, Mastercard
            </Text>
          </View>
        </View>
        {selectedPaymentMethod === 'zalopay' && (
          <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
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
            <Ionicons name="business-outline" size={22} color={colors.textSecondary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.paymentOptionTitle}>Thanh Toán Trực Tiếp Tại Showroom</Text>
            <Text style={styles.paymentOptionSub}>
              Tiền mặt / Chuyển khoản ngân hàng chính thức tại quầy giao dịch AutoMatch
            </Text>
          </View>
        </View>
        {selectedPaymentMethod === 'cash' && (
          <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
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
          size={20}
          color={colors.primary}
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
              ? `Thanh Toán Cọc ${formatVndPrice(depositAmount)} qua ZaloPay`
              : `Xác Nhận Đặt Cọc ${formatVndPrice(depositAmount)}`
          }
          onPress={handleProcessPayment}
          loading={isLoading}
          disabled={isLoading}
          icon={<Ionicons name="shield-checkmark" size={18} color={colors.textDark} />}
          style={styles.submitBtn}
          size="lg"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: 12,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs + 2,
    padding: spacing.sm + 2,
  },
  itemImage: {
    width: 70,
    height: 52,
    borderRadius: radii.sm,
    marginRight: spacing.md,
  },
  itemDetails: {
    flex: 1,
  },
  itemTitle: {
    color: colors.text,
    fontSize: typography.sizes.sm + 1,
    fontWeight: typography.weights.bold,
  },
  itemYear: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    marginTop: 1,
  },
  itemPrice: {
    color: colors.primary,
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.bold,
    marginTop: 2,
  },
  totalBox: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    ...shadows.sm,
  },
  totalLabel: {
    color: colors.text,
    fontSize: typography.sizes.sm,
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
  formCard: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  inputGroup: {
    gap: 4,
  },
  label: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  input: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: typography.sizes.sm,
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  paymentOptionCard: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  paymentOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(0, 229, 255, 0.04)',
  },
  paymentOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
    marginRight: spacing.sm,
  },
  paymentIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentOptionTitle: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  paymentOptionSub: {
    color: colors.textMuted,
    fontSize: typography.sizes['2xs'] + 1,
    marginTop: 2,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  termsText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    lineHeight: 18,
    flex: 1,
  },
  actionSection: {
    marginTop: spacing.md,
    marginBottom: 50,
  },
  submitBtn: {
    height: 52,
  },
});
