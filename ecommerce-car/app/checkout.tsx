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
import { colors } from '../src/theme/colors';
import { useAuthStore } from '../src/store/useAuthStore';
import { useCartStore } from '../src/store/useCartStore';
import { usePaymentStore } from '../src/store/usePaymentStore';
import { Button } from '../src/components/ui/Button';
import { Card } from '../src/components/ui/Card';

export default function CheckoutScreen() {
  const { user, profile } = useAuthStore();
  const { items, getTotalPrice, checkout, isCheckingOut } = useCartStore();
  const { createZaloPayOrder, openZaloPayUrl, isProcessing } = usePaymentStore();

  const [nameInput, setName] = useState<string | null>(null);
  const [phoneInput, setPhone] = useState<string | null>(null);
  const [emailInput, setEmail] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('Thanh toán đặt cọc mua xe');
  const [selectedMethod, setSelectedMethod] = useState<'zalopay' | 'cash'>('zalopay');

  const name = nameInput ?? profile?.full_name ?? '';
  const phone = phoneInput ?? profile?.phone ?? '';
  const email = emailInput ?? user?.email ?? '';

  const fallbackImage = 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=800';
  const totalPrice = getTotalPrice();

  const handleProcessPayment = async () => {
    if (!name.trim() || !phone.trim() || !address.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng điền đầy đủ Họ tên, Số điện thoại và Địa chỉ giao xe.');
      return;
    }

    if (items.length === 0) {
      Alert.alert('Giỏ hàng trống', 'Không có sản phẩm nào để thanh toán.');
      return;
    }

    try {
      // Step 1: Create Supabase Order via checkout_cart RPC
      const orderId = await checkout(user?.id, selectedMethod);

      if (selectedMethod === 'zalopay') {
        // Step 2: Build ZaloPay request payload
        const paymentItems = items.map((item) => ({
          id: item.car_id,
          name: item.car ? `${item.car.make} ${item.car.model}` : 'Xe ô tô',
          price: item.car?.price || 0,
          itemCount: item.quantity,
        }));

        const payload = {
          order_id: orderId,
          amount: totalPrice,
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
          // Step 4: Open ZaloPay web payment interface
          await openZaloPayUrl(response.order_url);
        } else {
          Alert.alert('Thông báo ZaloPay', response.return_message || 'Không thể tạo liên kết thanh toán ZaloPay');
        }

        // Navigate to Order Status screen with app_trans_id
        router.replace({
          pathname: `/order/${orderId}`,
          params: { app_trans_id: response.app_trans_id || '' },
        } as any);
      } else {
        // Cash payment fallback
        Alert.alert('Thành công', 'Đã ghi nhận đơn hàng. Nhân viên tư vấn sẽ liên hệ với bạn!');
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
      <Text style={styles.sectionTitle}>🚗 Sản Phẩm Thanh Toán</Text>
      {items.map((item) => (
        <Card key={item.id} style={styles.itemCard}>
          <Image
            source={{ uri: item.car?.image_url || fallbackImage }}
            style={styles.itemImage}
          />
          <View style={styles.itemDetails}>
            <Text style={styles.itemTitle} numberOfLines={1}>
              {item.car ? `${item.car.make} ${item.car.model} (${item.car.year})` : 'Mẫu xe AutoMatch'}
            </Text>
            <Text style={styles.itemPrice}>
              {item.car?.price ? `${(item.car.price / 1_000_000).toLocaleString('vi-VN')} triệu VNĐ` : 'Liên hệ'}
            </Text>
            <Text style={styles.itemQty}>Số lượng: x{item.quantity}</Text>
          </View>
        </Card>
      ))}

      {/* Total Card */}
      <View style={styles.totalBox}>
        <Text style={styles.totalLabel}>Tổng thanh toán đặt cọc:</Text>
        <Text style={styles.totalAmount}>
          {(totalPrice / 1_000_000).toLocaleString('vi-VN')} triệu VNĐ
        </Text>
      </View>

      {/* Customer Information Form */}
      <Text style={styles.sectionTitle}>👤 Thông Tin Nhận Xe & Hợp Đồng</Text>
      <View style={styles.formCard}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Họ và Tên *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Nguyễn Văn A"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Số điện thoại *</Text>
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
          <Text style={styles.label}>Email liên hệ</Text>
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
          <Text style={styles.label}>Địa chỉ nhận xe / Showroom *</Text>
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            placeholder="123 Nguyễn Huệ, Quận 1, TP.HCM"
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
      <Text style={styles.sectionTitle}>💳 Phương Thức Thanh Toán</Text>
      <TouchableOpacity
        activeOpacity={0.8}
        style={[
          styles.methodCard,
          selectedMethod === 'zalopay' && styles.methodSelected,
        ]}
        onPress={() => setSelectedMethod('zalopay')}
      >
        <View style={styles.methodHeader}>
          <View style={styles.methodIconBox}>
            <Ionicons name="card" size={24} color="#0088FF" />
          </View>
          <View style={styles.methodTextGroup}>
            <Text style={styles.methodTitle}>ZaloPay Gateway (Khuyên dùng)</Text>
            <Text style={styles.methodSub}>Thanh toán quét mã QR ZaloPay / Thẻ ATM / VISA</Text>
          </View>
        </View>
        {selectedMethod === 'zalopay' && (
          <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
        )}
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.8}
        style={[
          styles.methodCard,
          selectedMethod === 'cash' && styles.methodSelected,
        ]}
        onPress={() => setSelectedMethod('cash')}
      >
        <View style={styles.methodHeader}>
          <View style={styles.methodIconBox}>
            <Ionicons name="cash-outline" size={24} color={colors.textSecondary} />
          </View>
          <View style={styles.methodTextGroup}>
            <Text style={styles.methodTitle}>Thanh toán tại Showroom</Text>
            <Text style={styles.methodSub}>Thanh toán tiền mặt / Chuyển khoản trực tiếp</Text>
          </View>
        </View>
        {selectedMethod === 'cash' && (
          <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
        )}
      </TouchableOpacity>

      {/* Submit Button */}
      <View style={styles.actionSection}>
        <Button
          title={selectedMethod === 'zalopay' ? 'Thanh Toán Ngay qua ZaloPay' : 'Xác Nhận Đơn Hàng'}
          onPress={handleProcessPayment}
          loading={isLoading}
          disabled={isLoading}
          icon={<Ionicons name="shield-checkmark" size={18} color="#000" />}
          style={styles.submitBtn}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 10,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    padding: 10,
  },
  itemImage: {
    width: 64,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  itemPrice: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  itemQty: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  totalBox: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  totalLabel: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  totalAmount: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  formCard: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  inputGroup: {
    gap: 4,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 14,
  },
  textArea: {
    height: 64,
    textAlignVertical: 'top',
  },
  methodCard: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  methodSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceElevated,
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  methodIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodTextGroup: {
    flex: 1,
  },
  methodTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  methodSub: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  actionSection: {
    marginTop: 16,
    marginBottom: 40,
  },
  submitBtn: {
    height: 48,
  },
});
