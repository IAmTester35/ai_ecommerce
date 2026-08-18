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
        res.return_code === 1 ? 'Thành Công' : 'Trạng Thái ZaloPay',
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
        return <Badge label="Đã hoàn tất" variant="success" size="sm" dot />;
      case 'processing':
        return <Badge label="Đang xử lý" variant="primary" size="sm" dot />;
      case 'cancelled':
        return <Badge label="Đã hủy" variant="danger" size="sm" dot />;
      case 'pending':
      default:
        return <Badge label="Chờ xác nhận" variant="warning" size="sm" dot />;
    }
  };

  const getPaymentStatusBadge = (paymentStatus: PaymentStatus) => {
    switch (paymentStatus) {
      case 'paid':
        return <Badge label="Đã thanh toán" variant="success" size="sm" dot />;
      case 'refunded':
        return <Badge label="Đã hoàn tiền" variant="danger" size="sm" dot />;
      case 'unpaid':
      default:
        return <Badge label="Chưa thanh toán" variant="warning" size="sm" dot />;
    }
  };

  const fallbackImage =
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=800';

  if (isLoading || !selectedOrder) {
    return (
      <View style={[styles.screen, styles.centerBox]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Đang tải chi tiết đơn hàng từ Supabase...</Text>
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
          <Ionicons name="arrow-back" size={20} color={colors.text} />
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
        <Card style={styles.overviewCard}>
          <Text style={styles.cardHeaderTitle}>Thông Tin Đơn Hàng</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Mã đơn hàng:</Text>
            <Text style={styles.infoValueCode}>{selectedOrder.id}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Trạng thái đơn:</Text>
            {getOrderStatusBadge(selectedOrder.status)}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Trạng thái thanh toán:</Text>
            {getPaymentStatusBadge(selectedOrder.payment_status)}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phương thức thanh toán:</Text>
            <Text style={styles.infoValue}>
              {selectedOrder.payment_method === 'zalopay'
                ? 'Cổng thanh toán ZaloPay'
                : selectedOrder.payment_method || 'Chưa xác định'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Thời gian cập nhật:</Text>
            <Text style={styles.infoValue}>{updatedDate}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tổng tiền đơn hàng:</Text>
            <Text style={styles.totalAmount}>{formatVndPrice(selectedOrder.total_amount)}</Text>
          </View>
        </Card>

        {/* ZaloPay Payment Status Card (if trans id available) */}
        {app_trans_id && (
          <Card style={styles.paymentCard}>
            <View style={styles.paymentHeaderRow}>
              <View style={styles.paymentIconBox}>
                <Ionicons name="wallet-outline" size={20} color="#0088FF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.paymentTitle}>Cổng Thanh Toán ZaloPay</Text>
                <Text style={styles.paymentSubtitle}>Mã giao dịch: {app_trans_id}</Text>
              </View>
              {getPaymentStatusBadge(selectedOrder.payment_status)}
            </View>

            {statusResult && (
              <View style={styles.statusResultBox}>
                <Text style={styles.statusResultTitle}>Kết Quả Kiểm Tra:</Text>
                <Text style={styles.statusResultText}>• {statusResult.return_message}</Text>
                {statusResult.zp_trans_id && (
                  <Text style={styles.statusResultText}>• Mã ZaloPay: {statusResult.zp_trans_id}</Text>
                )}
              </View>
            )}

            <Button
              title={checkingPayment ? 'Đang Kiểm Tra...' : 'Cập Nhật Trạng Thái ZaloPay'}
              variant="outline"
              size="sm"
              onPress={handleCheckPaymentStatus}
              loading={checkingPayment || isProcessing}
              icon={<Ionicons name="refresh" size={14} color={colors.primary} />}
              style={{ marginTop: spacing.sm }}
            />
          </Card>
        )}

        {/* Ordered Car Items */}
        <Text style={styles.sectionTitle}>
          Danh Sách Xe ({selectedOrder.order_items?.length || 0})
        </Text>
        {selectedOrder.order_items?.map((item) => (
          <Card key={item.id} style={styles.itemCard}>
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
              <Ionicons name="document-text" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.contractTitle}>Hợp Đồng Điện Tử</Text>
              <Text style={styles.contractSub}>
                Nhấp để tải file hợp đồng đính kèm đơn hàng
              </Text>
            </View>
            <Ionicons name="download-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
        )}

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <Button
            title="Về Danh Sách Đơn Hàng"
            variant="outline"
            onPress={() => router.push('/orders' as any)}
            style={{ flex: 1 }}
          />
          <Button
            title="Khám Phá Thêm Xe"
            variant="primary"
            onPress={() => router.push('/(tabs)/catalog' as any)}
            style={{ flex: 1 }}
          />
        </View>

        <View style={{ height: 40 }} />
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
    gap: spacing.md,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
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
    fontSize: typography.sizes.base + 1,
    fontWeight: typography.weights.bold,
  },
  headerSubtitle: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    marginTop: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  overviewCard: {
    marginTop: spacing.lg,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.sm,
  },
  cardHeaderTitle: {
    color: colors.text,
    fontSize: typography.sizes.sm + 1,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs + 1,
  },
  infoValue: {
    color: colors.text,
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.semibold,
  },
  infoValueCode: {
    color: colors.primary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    maxWidth: 200,
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
  totalAmount: {
    color: colors.primary,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.extrabold,
  },
  paymentCard: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderColor: 'rgba(0, 136, 255, 0.25)',
  },
  paymentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  paymentIconBox: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: 'rgba(0, 136, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentTitle: {
    color: colors.text,
    fontSize: typography.sizes.sm + 1,
    fontWeight: typography.weights.bold,
  },
  paymentSubtitle: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
  },
  statusResultBox: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.sm,
    padding: spacing.sm,
    marginTop: spacing.sm,
    gap: 2,
  },
  statusResultTitle: {
    color: colors.textMuted,
    fontSize: typography.sizes['2xs'],
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
  },
  statusResultText: {
    color: colors.text,
    fontSize: typography.sizes.xs,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm + 2,
    marginBottom: spacing.sm,
  },
  itemThumb: {
    width: 75,
    height: 55,
    borderRadius: radii.sm,
    marginRight: spacing.md,
  },
  itemInfo: {
    flex: 1,
  },
  itemCarName: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  itemQuantity: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  itemDepositPrice: {
    color: colors.primary,
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.bold,
    marginTop: 2,
  },
  contractBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginTop: spacing.md,
    gap: spacing.md,
    ...shadows.glowCyan,
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
    fontSize: typography.sizes.sm + 1,
    fontWeight: typography.weights.bold,
  },
  contractSub: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  bottomActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
});
