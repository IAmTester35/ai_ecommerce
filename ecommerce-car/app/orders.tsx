import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors } from '../src/theme/colors';
import { useAuthStore } from '../src/store/useAuthStore';
import { useOrderStore } from '../src/store/useOrderStore';
import { Card } from '../src/components/ui/Card';
import { Badge } from '../src/components/ui/Badge';
import { Button } from '../src/components/ui/Button';

export default function OrdersScreen() {
  const { user } = useAuthStore();
  const { orders, fetchOrders, isLoading } = useOrderStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchOrders(user.id);
    }
  }, [fetchOrders, user]);

  const onRefresh = async () => {
    if (user?.id) {
      setRefreshing(true);
      await fetchOrders(user.id);
      setRefreshing(false);
    }
  };

  const getOrderStatusVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'processing':
        return 'primary';
      case 'cancelled':
        return 'conflict';
      default:
        return 'secondary';
    }
  };

  const getPaymentStatusVariant = (pStatus: string) => {
    switch (pStatus) {
      case 'paid':
        return 'success';
      case 'refunded':
        return 'conflict';
      default:
        return 'warning';
    }
  };

  const renderOrderItem = ({ item }: { item: any }) => {
    const itemCount = item.order_items?.length || 0;
    const formattedAmount = (item.total_amount / 1_000_000).toLocaleString('vi-VN');
    const createdDate = new Date(item.created_at).toLocaleDateString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.push(`/order/${item.id}` as any)}
      >
        <Card style={styles.orderCard}>
          <View style={styles.cardHeader}>
            <View style={styles.headerInfo}>
              <Text style={styles.orderIdText} numberOfLines={1}>
                Mã ĐH: #{item.id.slice(0, 8).toUpperCase()}
              </Text>
              <Text style={styles.dateText}>⏰ {createdDate}</Text>
            </View>
            <View style={styles.badgeGroup}>
              <Badge
                label={item.payment_status === 'paid' ? 'Đã Thanh Toán' : 'Chưa Thanh Toán'}
                variant={getPaymentStatusVariant(item.payment_status)}
                size="sm"
              />
              <Badge
                label={
                  item.status === 'processing'
                    ? 'Đang xử lý'
                    : item.status === 'completed'
                    ? 'Đã hoàn thành'
                    : item.status === 'cancelled'
                    ? 'Đã hủy'
                    : 'Chờ xác nhận'
                }
                variant={getOrderStatusVariant(item.status)}
                size="sm"
              />
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.cardBody}>
            <Text style={styles.itemSummary}>
              🚗 {itemCount} sản phẩm trong đơn
            </Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Tổng tiền:</Text>
              <Text style={styles.priceValue}>{formattedAmount} triệu VNĐ</Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.detailLink}>Xem chi tiết đơn hàng & trạng thái ZaloPay</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {isLoading && !refreshing ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải danh sách đơn hàng...</Text>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="bag-handle-outline" size={64} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Chưa Có Đơn Hàng Nào</Text>
          <Text style={styles.emptySub}>
            Bạn chưa thực hiện giao dịch hoặc đặt cọc mua xe nào.
          </Text>
          <Button
            title="Khám Phá Xe Ngay"
            onPress={() => router.push('/(tabs)/ai-chat' as any)}
            style={styles.exploreBtn}
          />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  orderCard: {
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerInfo: {
    gap: 4,
    flex: 1,
  },
  orderIdText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  dateText: {
    color: colors.textMuted,
    fontSize: 11,
  },
  badgeGroup: {
    alignItems: 'flex-end',
    gap: 4,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemSummary: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priceLabel: {
    color: colors.textMuted,
    fontSize: 12,
  },
  priceValue: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '800',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  detailLink: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  emptyBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  emptySub: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
  exploreBtn: {
    marginTop: 12,
    paddingHorizontal: 24,
  },
});
