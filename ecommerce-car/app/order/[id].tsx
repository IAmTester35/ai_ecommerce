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
import { colors } from '../../src/theme/colors';
import { useOrderStore } from '../../src/store/useOrderStore';
import { usePaymentStore } from '../../src/store/usePaymentStore';
import { Card } from '../../src/components/ui/Card';
import { Badge } from '../../src/components/ui/Badge';
import { Button } from '../../src/components/ui/Button';

export default function OrderDetailScreen() {
  const { id, app_trans_id } = useLocalSearchParams<{ id: string; app_trans_id?: string }>();
  const { selectedOrder, fetchOrderDetails, isLoading } = useOrderStore();
  const { checkPaymentStatus, isProcessing, statusResult } = usePaymentStore();

  const [checkingPayment, setCheckingPayment] = useState(false);

  const handleCheckPaymentStatus = async (transId?: string, showAlert = true) => {
    const targetId = transId || app_trans_id || selectedOrder?.app_trans_id;
    if (!targetId) {
      if (showAlert) Alert.alert('Thông báo', 'Không tìm thấy mã giao dịch ZaloPay (app_trans_id).');
      return;
    }

    setCheckingPayment(true);
    try {
      const res = await checkPaymentStatus(targetId);
      if (id) {
        await fetchOrderDetails(id); // Reload updated order status from DB
      }
      if (showAlert) {
        Alert.alert(
          res.return_code === 1 ? 'Thành công' : 'Trạng thái ZaloPay',
          `ZaloPay: ${res.return_message}`
        );
      }
    } catch (err: any) {
      if (showAlert) {
        Alert.alert('Lỗi kiểm tra', err.message || 'Không thể lấy trạng thái ZaloPay.');
      }
    } finally {
      setCheckingPayment(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    if (!id) return;

    const initOrderData = async () => {
      await fetchOrderDetails(id);
      const transId = app_trans_id || selectedOrder?.app_trans_id;
      if (transId && isMounted) {
        try {
          await checkPaymentStatus(transId);
          if (isMounted) {
            await fetchOrderDetails(id);
          }
        } catch {
          // ignore auto-check errors on initial mount
        }
      }
    };

    initOrderData();

    return () => {
      isMounted = false;
    };
  }, [id, app_trans_id, fetchOrderDetails, checkPaymentStatus, selectedOrder?.app_trans_id]);

  const fallbackImage = 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=800';

  if (isLoading || !selectedOrder) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Đang tải chi tiết đơn hàng...</Text>
      </View>
    );
  }

  const createdDate = new Date(selectedOrder.created_at).toLocaleString('vi-VN');
  const formattedTotal = (selectedOrder.total_amount / 1_000_000).toLocaleString('vi-VN');

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Info */}
      <View style={styles.headerBox}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.orderTitle}>Đơn Hàng #{selectedOrder.id.slice(0, 8).toUpperCase()}</Text>
          <Badge
            label={selectedOrder.payment_status === 'paid' ? 'Đã Thanh Toán' : 'Chưa Thanh Toán'}
            variant={selectedOrder.payment_status === 'paid' ? 'success' : 'warning'}
            size="sm"
          />
        </View>
        <Text style={styles.createdDateText}>⏰ Ngày đặt: {createdDate}</Text>
      </View>

      {/* ZaloPay Payment Status Card */}
      <Card style={styles.paymentCard}>
        <View style={styles.paymentHeader}>
          <View style={styles.paymentTitleBox}>
            <Ionicons name="wallet-outline" size={22} color="#0088FF" />
            <Text style={styles.paymentCardTitle}>Trạng Thái Thanh Toán ZaloPay</Text>
          </View>
          <Badge
            label={
              selectedOrder.payment_status === 'paid'
                ? 'Giao Dịch Thành Công'
                : 'Chờ Thanh Toán / Callback'
            }
            variant={selectedOrder.payment_status === 'paid' ? 'success' : 'warning'}
            size="sm"
          />
        </View>

        {(app_trans_id || selectedOrder.app_trans_id) && (
          <View style={styles.transBox}>
            <Text style={styles.transLabel}>Mã giao dịch ZaloPay (app_trans_id):</Text>
            <Text style={styles.transValue}>{app_trans_id || selectedOrder.app_trans_id}</Text>
          </View>
        )}

        {statusResult && (
          <View style={styles.statusResultBox}>
            <Text style={styles.statusResultTitle}>kết quả kiểm tra gần nhất:</Text>
            <Text style={styles.statusResultText}>• {statusResult.return_message}</Text>
            {statusResult.zp_trans_id && (
              <Text style={styles.statusResultText}>• ZP Trans ID: {statusResult.zp_trans_id}</Text>
            )}
          </View>
        )}

        <Button
          title={checkingPayment ? 'Đang Kiểm Tra ZaloPay...' : 'Cập Nhật Trạng Thái ZaloPay'}
          onPress={() => handleCheckPaymentStatus(undefined, true)}
          loading={checkingPayment || isProcessing}
          variant="outline"
          style={styles.checkStatusBtn}
          icon={<Ionicons name="refresh" size={16} color={colors.primary} />}
        />
      </Card>

      {/* Order Items Section */}
      <Text style={styles.sectionTitle}>🚘 Danh Sách Sản Phẩm</Text>
      {selectedOrder.order_items?.map((item) => (
        <Card key={item.id} style={styles.itemCard}>
          <Image
            source={{ uri: item.car?.image_url || fallbackImage }}
            style={styles.itemImage}
          />
          <View style={styles.itemInfo}>
            <Text style={styles.itemCarName}>
              {item.car ? `${item.car.make} ${item.car.model} (${item.car.year})` : 'Xe AutoMatch'}
            </Text>
            <Text style={styles.itemPrice}>
              {(item.price / 1_000_000).toLocaleString('vi-VN')} triệu VNĐ
            </Text>
            <Text style={styles.itemQty}>Số lượng: {item.quantity}</Text>
          </View>
        </Card>
      ))}

      {/* Payment & Amount Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Phương thức thanh toán:</Text>
          <Text style={styles.summaryValue}>
            {selectedOrder.payment_method?.toUpperCase() || 'ZALOPAY'}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Trạng thái xử lý đơn:</Text>
          <Text style={styles.summaryValue}>
            {selectedOrder.status === 'processing'
              ? 'Đang xử lý'
              : selectedOrder.status === 'completed'
              ? 'Đã giao xe thành công'
              : selectedOrder.status === 'cancelled'
              ? 'Đã hủy'
              : 'Chờ xác nhận'}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Tổng tiền đặt cọc:</Text>
          <Text style={styles.totalValue}>{formattedTotal} triệu VNĐ</Text>
        </View>
      </View>

      {/* Contract Link if available */}
      {selectedOrder.contract_url && (
        <TouchableOpacity
          style={styles.contractBox}
          onPress={() => Linking.openURL(selectedOrder.contract_url!)}
        >
          <Ionicons name="document-text-outline" size={24} color={colors.primary} />
          <View style={styles.contractTextGroup}>
            <Text style={styles.contractTitle}>Hợp Đồng Mua Bán Xe Điện Tử</Text>
            <Text style={styles.contractSub}>Nhấp để tải hoặc xem chi tiết hợp đồng PDF</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.primary} />
        </TouchableOpacity>
      )}

      {/* Bottom Back Button */}
      <View style={styles.bottomActions}>
        <Button
          title="Quay Về Danh Sách Đơn Hàng"
          onPress={() => router.push('/orders' as any)}
          variant="secondary"
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
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  headerBox: {
    marginBottom: 16,
    gap: 4,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  createdDateText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  paymentCard: {
    marginBottom: 16,
    padding: 14,
    borderColor: '#0088FF33',
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  paymentTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paymentCardTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  transBox: {
    backgroundColor: 'rgba(0, 136, 255, 0.08)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  transLabel: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  transValue: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  statusResultBox: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    gap: 2,
  },
  statusResultTitle: {
    color: colors.textMuted,
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '700',
    marginBottom: 2,
  },
  statusResultText: {
    color: colors.text,
    fontSize: 12,
  },
  checkStatusBtn: {
    height: 40,
    marginTop: 4,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginBottom: 8,
  },
  itemImage: {
    width: 60,
    height: 45,
    borderRadius: 6,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemCarName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  itemPrice: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  itemQty: {
    color: colors.textMuted,
    fontSize: 11,
  },
  summaryCard: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  summaryValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  totalLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  totalValue: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: '800',
  },
  contractBox: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
  },
  contractTextGroup: {
    flex: 1,
  },
  contractTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  contractSub: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  bottomActions: {
    marginTop: 20,
    marginBottom: 40,
  },
});
