import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, radii, spacing, typography, shadows } from '../theme';
import { useAuthStore } from '../store/useAuthStore';
import { useOrderStore } from '../store/useOrderStore';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { formatVndPrice } from '../components/ui/PriceTag';
import { Order, OrderStatus } from '../types';

const STATUS_TABS: { id: string; label: string }[] = [
  { id: 'all', label: 'Tất Cả' },
  { id: 'processing', label: 'Đang Xử Lý' },
  { id: 'completed', label: 'Đã Giao Xe' },
  { id: 'cancelled', label: 'Đã Hủy' },
];

export default function OrdersScreen() {
  const { user } = useAuthStore();
  const { orders, fetchOrders, isLoading } = useOrderStore();
  const [selectedStatusTab, setSelectedStatusTab] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOrders(user?.id);
  }, [fetchOrders, user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders(user?.id);
    setRefreshing(false);
  };

  const filteredOrders = useMemo(() => {
    if (selectedStatusTab === 'all') return orders;
    return orders.filter((o) => o.status === selectedStatusTab);
  }, [orders, selectedStatusTab]);

  const getOrderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'completed':
        return <Badge label="Đã Giao Xe" variant="success" size="xs" dot />;
      case 'processing':
        return <Badge label="Đang Xử Lý" variant="primary" size="xs" dot />;
      case 'cancelled':
        return <Badge label="Đã Hủy" variant="danger" size="xs" dot />;
      case 'pending':
      default:
        return <Badge label="Chờ Xác Nhận" variant="warning" size="xs" dot />;
    }
  };

  const fallbackImage =
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=800';

  const renderOrderItem = ({ item }: { item: Order }) => {
    const createdDate = new Date(item.created_at).toLocaleDateString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const firstCar = item.order_items?.[0]?.car;

    return (
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={() => router.push(`/order/${item.id}` as any)}
      >
        <Card style={styles.orderCard}>
          {/* Header Row */}
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.orderIdText}>
                Đơn #{item.id.slice(0, 10).toUpperCase()}
              </Text>
              <Text style={styles.dateText}>⏰ {createdDate}</Text>
            </View>
            {getOrderStatusBadge(item.status)}
          </View>

          <View style={styles.divider} />

          {/* Car preview row */}
          <View style={styles.carPreviewRow}>
            <Image
              source={{ uri: firstCar?.image_url || fallbackImage }}
              style={styles.carThumb}
              contentFit="cover"
            />
            <View style={styles.carInfo}>
              <Text style={styles.carName} numberOfLines={1}>
                {firstCar ? `${firstCar.make} ${firstCar.model} (${firstCar.year})` : 'Xe ô tô AutoMatch'}
              </Text>
              <Text style={styles.itemCountText}>
                Số lượng: x{item.order_items?.reduce((s, i) => s + i.quantity, 0) || 1} xe
              </Text>
              <Badge
                label={item.payment_status === 'paid' ? 'Đã Cọc ZaloPay' : 'Chưa Thanh Toán'}
                variant={item.payment_status === 'paid' ? 'success' : 'warning'}
                size="xs"
                style={{ marginTop: 4 }}
              />
            </View>
          </View>

          <View style={styles.cardFooter}>
            <View>
              <Text style={styles.depositLabel}>Tổng tiền cọc:</Text>
              <Text style={styles.depositAmount}>{formatVndPrice(item.total_amount)}</Text>
            </View>

            <View style={styles.trackingLink}>
              <Text style={styles.trackingLinkText}>Xem Tiến Độ</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.primary} />
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đơn Hàng & Hợp Đồng</Text>
      </View>

      {/* Filter Status Tabs */}
      <View style={styles.tabBar}>
        {STATUS_TABS.map((tab) => {
          const isSelected = selectedStatusTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              activeOpacity={0.7}
              onPress={() => setSelectedStatusTab(tab.id)}
              style={[styles.tabBtn, isSelected && styles.tabBtnActive]}
            >
              <Text style={[styles.tabText, isSelected && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {isLoading && !refreshing ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải danh sách đơn hàng...</Text>
        </View>
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          icon="receipt-outline"
          title="Chưa Có Đơn Hàng Nào"
          description="Bạn chưa thực hiện giao dịch hoặc đặt cọc giữ xe nào trong mục này."
          actionTitle="Khám Phá Showroom"
          onAction={() => router.push('/(tabs)/catalog' as any)}
        />
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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
  screen: {
    flex: 1,
    backgroundColor: colors.background,
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
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.xs,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radii.sm,
  },
  tabBtnActive: {
    backgroundColor: colors.primaryMuted,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: 40,
    gap: spacing.md,
  },
  orderCard: {
    padding: spacing.md,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderIdText: {
    color: colors.text,
    fontSize: typography.sizes.sm + 1,
    fontWeight: typography.weights.bold,
  },
  dateText: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  carPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  carThumb: {
    width: 75,
    height: 55,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceElevated,
  },
  carInfo: {
    flex: 1,
  },
  carName: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  itemCountText: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  depositLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
  },
  depositAmount: {
    color: colors.primary,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.extrabold,
  },
  trackingLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: radii.xs,
    gap: 4,
  },
  trackingLinkText: {
    color: colors.primary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
});
