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
import { colors, radii, spacing, typography } from '../theme';
import { useAuthStore } from '../store/useAuthStore';
import { useOrderStore } from '../store/useOrderStore';
import { useResponsive } from '../hooks/useResponsive';
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
  const { select } = useResponsive();

  const [selectedStatusTab, setSelectedStatusTab] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const numColumns = select({ mobile: 1, tablet: 2, desktop: 2, wide: 3 });

  useEffect(() => {
    if (user?.id) {
      fetchOrders(user.id);
    }
  }, [fetchOrders, user?.id]);

  const onRefresh = async () => {
    if (!user?.id) return;
    setRefreshing(true);
    await fetchOrders(user.id);
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
        activeOpacity={0.85}
        onPress={() => router.push(`/order/${item.id}` as any)}
        style={numColumns > 1 ? styles.gridCardItem : undefined}
      >
        <Card style={styles.orderCard} padding={spacing.sm}>
          {/* Header Row */}
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.orderIdText}>
                Đơn #{item.id.slice(0, 8).toUpperCase()}
              </Text>
              <View style={styles.dateRow}>
                <Ionicons name="time-outline" size={10} color={colors.textMuted} style={{ marginRight: 3 }} />
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
                style={{ marginTop: 3 }}
              />
            </View>
          </View>

          <View style={styles.cardFooter}>
            <View>
              <Text style={styles.depositLabel}>Tiền cọc (10%):</Text>
              <Text style={styles.depositAmount}>{formatVndPrice(Math.round(item.total_amount * 0.10))}</Text>
            </View>

            <View style={styles.trackingLink}>
              <Text style={styles.trackingLinkText}>Xem tiến độ</Text>
              <Ionicons name="chevron-forward" size={11} color={colors.primaryHover} />
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
        <View style={styles.headerInner}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={16} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Đơn Hàng & Hợp Đồng</Text>
        </View>
      </View>

      {/* Filter Status Tabs (Show only when authenticated) */}
      {user ? (
        <View style={styles.tabBar}>
          <View style={styles.tabBarInner}>
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
        </View>
      ) : null}

      {!user ? (
        <EmptyState
          icon="lock-closed-outline"
          title="Yêu cầu đăng nhập"
          description="Vui lòng đăng nhập để xem danh sách đơn hàng và hợp đồng đặt cọc của bạn."
          actionTitle="Đăng Nhập Ngay"
          onAction={() => router.push('/(auth)/login' as any)}
        />
      ) : isLoading && !refreshing ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải danh sách...</Text>
        </View>
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          icon="receipt-outline"
          title="Chưa có đơn hàng"
          description="Bạn chưa thực hiện giao dịch nào trong mục này."
          actionTitle="Khám phá kho xe"
          onAction={() => router.push('/(tabs)/catalog' as any)}
        />
      ) : (
        <FlatList
          key={`orders-grid-${numColumns}`}
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
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
    paddingTop: 48,
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
  tabBar: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  tabBarInner: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: 6,
    gap: spacing.xs,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: radii.xs,
  },
  tabBtnActive: {
    backgroundColor: colors.primaryMuted,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: typography.weights.medium,
  },
  tabTextActive: {
    color: colors.primaryHover,
    fontWeight: typography.weights.semibold,
  },
  listContent: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: 32,
    gap: spacing.xs + 2,
  },
  columnWrapper: {
    gap: spacing.md,
  },
  gridCardItem: {
    flex: 1,
  },
  orderCard: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderIdText: {
    color: colors.text,
    fontSize: typography.sizes.xs + 0.5,
    fontWeight: typography.weights.semibold,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  dateText: {
    color: colors.textMuted,
    fontSize: 10,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: spacing.xs + 2,
  },
  carPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  carThumb: {
    width: 60,
    height: 42,
    borderRadius: radii.xs,
    backgroundColor: colors.surfaceElevated,
  },
  carInfo: {
    flex: 1,
  },
  carName: {
    color: colors.text,
    fontSize: 11,
    fontWeight: typography.weights.semibold,
    lineHeight: 15,
  },
  itemCountText: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
  },
  depositLabel: {
    color: colors.textSecondary,
    fontSize: 10,
  },
  depositAmount: {
    color: colors.primaryHover,
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.bold,
  },
  trackingLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.full,
    gap: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  trackingLinkText: {
    color: colors.primaryHover,
    fontSize: 10,
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
