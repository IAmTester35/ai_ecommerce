import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { colors, radii, spacing, typography, shadows } from '../../theme';
import { useOrderStore } from '../../store/useOrderStore';
import { usePaymentStore } from '../../store/usePaymentStore';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatVndPrice } from '../../components/ui/PriceTag';
import { OrderStatus, PaymentStatus } from '../../types';
import { FALLBACK_CAR_URL } from '../../constants/images';

export default function OrderDetailScreen() {
  const { id, app_trans_id } = useLocalSearchParams<{ id: string; app_trans_id?: string }>();
  const { selectedOrder, fetchOrderDetails, isLoading } = useOrderStore();
  const { checkPaymentStatus, isProcessing, statusResult } = usePaymentStore();

  const [checkingPayment, setCheckingPayment] = useState(false);

  useEffect(() => {
    if (id) {
      fetchOrderDetails(id);
    }
  }, [id, fetchOrderDetails]);

  const handleCheckPaymentStatus = async () => {
    const transId = app_trans_id;
    if (!transId) {
      Alert.alert('Thông báo', 'Không tìm thấy mã giao dịch ZaloPay (app_trans_id).');
      return;
    }

    setCheckingPayment(true);
    try {
      const res = await checkPaymentStatus(transId);
      if (id) {
        await fetchOrderDetails(id);
      }
      Alert.alert(
        res.return_code === 1 ? 'Thành công' : 'Trạng thái ZaloPay',
        `Phản hồi: ${res.return_message}`
      );
    } catch (err: any) {
      Alert.alert('Lỗi kiểm tra', err.message || 'Không thể lấy trạng thái từ ZaloPay.');
    } finally {
      setCheckingPayment(false);
    }
  };

  const getOrderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'completed':
        return <Badge label="Đã hoàn tất" variant="success" size="xs" dot />;
      case 'processing':
        return <Badge label="Đang xử lý" variant="primary" size="xs" dot />;
      case 'cancelled':
        return <Badge label="Đã hủy" variant="danger" size="xs" dot />;
      case 'pending':
      default:
        return <Badge label="Chờ xác nhận" variant="warning" size="xs" dot />;
    }
  };

  const getPaymentStatusBadge = (paymentStatus: PaymentStatus) => {
    switch (paymentStatus) {
      case 'paid':
        return <Badge label="Đã thanh toán" variant="success" size="xs" dot />;
      case 'refunded':
        return <Badge label="Đã hoàn tiền" variant="danger" size="xs" dot />;
      case 'unpaid':
      default:
        return <Badge label="Chờ thanh toán" variant="warning" size="xs" dot />;
    }
  };

  const fallbackImage = FALLBACK_CAR_URL;

  if (isLoading || !selectedOrder) {
    return (
      <View style={[styles.screen, styles.centerBox]}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.loadingText}>Đang tải chi tiết đơn hàng...</Text>
      </View>
    );
  }

  const createdDate = new Date(selectedOrder.created_at).toLocaleDateString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const updatedDate = new Date(selectedOrder.updated_at).toLocaleDateString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <View style={styles.screen}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>
            Đơn #{selectedOrder.id.slice(0, 8).toUpperCase()}
          </Text>
          <Text style={styles.headerSubtitle}>Ngày tạo: {createdDate}</Text>
        </View>
        {getOrderStatusBadge(selectedOrder.status)}
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Order Overview Summary Card */}
        <Card style={styles.overviewCard} padding={spacing.md}>
          <Text style={styles.cardHeaderTitle}>Thông tin đơn hàng</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Mã đơn hàng:</Text>
            <Text style={styles.infoValueCode} numberOfLines={1}>{selectedOrder.id}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Trạng thái đơn:</Text>
            {getOrderStatusBadge(selectedOrder.status)}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Thanh toán:</Text>
            {getPaymentStatusBadge(selectedOrder.payment_status)}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Hình thức:</Text>
            <Text style={styles.infoValue}>
              {selectedOrder.payment_method === 'zalopay'
                ? 'ZaloPay Gateway'
                : selectedOrder.payment_method || 'Trực tiếp tại showroom'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Cập nhật lần cuối:</Text>
            <Text style={styles.infoValue}>{updatedDate}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tổng tiền cọc:</Text>
            <Text style={styles.totalAmount}>{formatVndPrice(selectedOrder.total_amount)}</Text>
          </View>
        </Card>

        {/* ZaloPay Payment Status Card (if trans id available) */}
        {app_trans_id && (
          <Card style={styles.paymentCard} padding={spacing.md}>
            <View style={styles.paymentHeaderRow}>
              <View style={styles.paymentIconBox}>
                <Ionicons name="wallet-outline" size={18} color="#0088FF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.paymentTitle}>Cổng Thanh Toán ZaloPay</Text>
                <Text style={styles.paymentSubtitle}>Mã GD: {app_trans_id}</Text>
              </View>
              {getPaymentStatusBadge(selectedOrder.payment_status)}
            </View>

            {statusResult && (
              <View style={styles.statusResultBox}>
                <Text style={styles.statusResultTitle}>Kết quả giao dịch:</Text>
                <Text style={styles.statusResultText}>• {statusResult.return_message}</Text>
                {statusResult.zp_trans_id && (
                  <Text style={styles.statusResultText}>• Mã ZaloPay: {statusResult.zp_trans_id}</Text>
                )}
              </View>
            )}

            <Button
              title={checkingPayment ? 'Đang kiểm tra...' : 'Cập nhật trạng thái ZaloPay'}
              variant="outline"
              size="sm"
              onPress={handleCheckPaymentStatus}
              loading={checkingPayment || isProcessing}
              icon={<Ionicons name="refresh" size={13} color={colors.primaryHover} />}
              style={{ marginTop: spacing.sm }}
            />
          </Card>
        )}

        {/* Ordered Car Items */}
        <Text style={styles.sectionTitle}>
          Danh sách xe ({selectedOrder.order_items?.length || 0})
        </Text>
        {selectedOrder.order_items?.map((item) => (
          <Card key={item.id} style={styles.itemCard} padding={spacing.sm}>
            <Image
              source={{ uri: item.car?.image_url || fallbackImage }}
              style={styles.itemThumb}
              contentFit="cover"
            />
            <View style={styles.itemInfo}>
              <Text style={styles.itemCarName}>
                {item.car ? `${item.car.make} ${item.car.model} (${item.car.year})` : 'Xe AutoMatch'}
              </Text>
              <Text style={styles.itemQuantity}>Số lượng: x{item.quantity} xe</Text>
              <Text style={styles.itemDepositPrice}>
                Đơn giá: {formatVndPrice(item.price)}
              </Text>
            </View>
          </Card>
        ))}

        {/* Electronic Contract PDF Download */}
        {selectedOrder.contract_url && (
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.contractBox}
            onPress={() => Linking.openURL(selectedOrder.contract_url!)}
          >
            <View style={styles.contractIconCircle}>
              <Ionicons name="document-text-outline" size={18} color={colors.primaryHover} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.contractTitle}>Hợp Đồng Điện Tử</Text>
              <Text style={styles.contractSub}>
                Tải file hợp đồng điện tử đính kèm
              </Text>
            </View>
            <Ionicons name="download-outline" size={18} color={colors.primaryHover} />
          </TouchableOpacity>
        )}

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <Button
            title="Danh sách đơn"
            variant="outline"
            size="md"
            onPress={() => router.push('/orders' as any)}
            style={{ flex: 1 }}
          />
          <Button
            title="Khám phá xe"
            variant="primary"
            size="md"
            onPress={() => router.push('/(tabs)/catalog' as any)}
            style={{ flex: 1 }}
          />
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerBox: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
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
  headerSubtitle: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing['2xl'],
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    lineHeight: 22,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  overviewCard: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radii.lg,
    gap: spacing.sm,
    ...shadows.sm,
  },
  cardHeaderTitle: {
    color: colors.text,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    lineHeight: 22,
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 2,
  },
  infoLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    lineHeight: 18,
  },
  infoValue: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  infoValueCode: {
    color: colors.primaryHover,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    maxWidth: 200,
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
  totalAmount: {
    color: colors.primaryHover,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  paymentCard: {
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.lg,
    ...shadows.sm,
  },
  paymentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  paymentIconBox: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    backgroundColor: 'rgba(0, 136, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentTitle: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  paymentSubtitle: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
  },
  statusResultBox: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    gap: 4,
  },
  statusResultTitle: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: typography.weights.semibold,
    textTransform: 'uppercase',
  },
  statusResultText: {
    color: colors.text,
    fontSize: typography.sizes.xs,
    lineHeight: 18,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.lg,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  itemThumb: {
    width: 70,
    height: 50,
    borderRadius: radii.sm,
    marginRight: spacing.md,
    backgroundColor: colors.surfaceElevated,
  },
  itemInfo: {
    flex: 1,
  },
  itemCarName: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    lineHeight: 18,
  },
  itemQuantity: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  itemDepositPrice: {
    color: colors.primaryHover,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    marginTop: 2,
  },
  contractBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginTop: spacing.lg,
    gap: spacing.md,
    ...shadows.sm,
  },
  contractIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contractTitle: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    lineHeight: 20,
  },
  contractSub: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    lineHeight: 16,
    marginTop: 2,
  },
  bottomActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
    marginBottom: 40,
  },
});

