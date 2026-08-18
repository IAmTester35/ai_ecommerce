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
import { FALLBACK_CAR_URL } from '../constants/images';

const STATUS_TABS: { id: string; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'processing', label: 'Đang xử lý' },
  { id: 'completed', label: 'Đã giao xe' },
  { id: 'cancelled', label: 'Đã hủy' },
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
        return <Badge label="Đã giao xe" variant="success" size="xs" dot />;
      case 'processing':
        return <Badge label="Đang xử lý" variant="primary" size="xs" dot />;
      case 'cancelled':
        return <Badge label="Đã hủy" variant="danger" size="xs" dot />;
      case 'pending':
      default:
        return <Badge label="Chờ xác nhận" variant="warning" size="xs" dot />;
    }
  };

  const fallbackImage = FALLBACK_CAR_URL;

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
        <Card style={styles.orderCard} padding={spacing.sm + 2}>
          {/* Header Row */}
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.orderIdText}>
                Đơn #{item.id.slice(0, 8).toUpperCase()}
              </Text>
              <View style={styles.dateRow}>
                <Ionicons name="time-outline" size={11} color={colors.textMuted} style={{ marginRight: 3 }} />
                <Text style={styles.dateText}>{createdDate}</Text>
              </View>
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
                label={item.payment_status === 'paid' ? 'Đã cọc ZaloPay' : 'Chưa thanh toán'}
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
              <Text style={styles.trackingLinkText}>Xem tiến độ</Text>
              <Ionicons name="chevron-forward" size={12} color={colors.primaryHover} />
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
          <Ionicons name="arrow-back" size={18} color={colors.text} />
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
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải danh sách đơn hàng...</Text>
        </View>
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          icon="receipt-outline"
          title="Chưa có đơn hàng"
          description="Bạn chưa thực hiện giao dịch hoặc đặt cọc giữ xe nào trong mục này."
          actionTitle="Khám phá Showroom"
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.xs,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 5,
    alignItems: 'center',
    borderRadius: radii.xs,
  },
  tabBtnActive: {
    backgroundColor: colors.primaryMuted,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: typography.sizes['2xs'] + 1,
    fontWeight: typography.weights.medium,
  },
  tabTextActive: {
    color: colors.primaryHover,
    fontWeight: typography.weights.semibold,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: 32,
    gap: spacing.sm,
  },
  orderCard: {
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderIdText: {
    color: colors.text,
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.semibold,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  dateText: {
    color: colors.textMuted,
    fontSize: typography.sizes['2xs'],
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.xs + 2,
  },
  carPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
  },
  carThumb: {
    width: 65,
    height: 48,
    borderRadius: radii.xs,
    backgroundColor: colors.surfaceElevated,
  },
  carInfo: {
    flex: 1,
  },
  carName: {
    color: colors.text,
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.semibold,
  },
  itemCountText: {
    color: colors.textMuted,
    fontSize: typography.sizes['2xs'],
    marginTop: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.xs + 2,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  depositLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes['2xs'],
  },
  depositAmount: {
    color: colors.primaryHover,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  trackingLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.xs,
    gap: 3,
  },
  trackingLinkText: {
    color: colors.primaryHover,
    fontSize: typography.sizes['2xs'],
    fontWeight: typography.weights.semibold,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
  },
});

