import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, radii, spacing, typography, shadows } from '../theme';
import { useNotificationStore } from '../store/useNotificationStore';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { NotificationItem } from '../types';

export default function NotificationsScreen() {
  const { notifications, fetchNotifications, markAsRead, markAllAsRead, isLoading } =
    useNotificationStore();

  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const displayedNotifications = filterUnreadOnly
    ? notifications.filter((n) => !n.is_read)
    : notifications;

  const getNotifIcon = (type?: string | null) => {
    switch (type) {
      case 'order':
        return { icon: 'receipt-outline' as const, color: colors.primaryHover, bg: colors.primaryMuted };
      case 'promo':
        return { icon: 'flash-outline' as const, color: colors.conflict, bg: colors.conflictMuted };
      case 'test_drive':
        return { icon: 'car-sport-outline' as const, color: colors.success, bg: colors.successMuted };
      default:
        return { icon: 'notifications-outline' as const, color: colors.info, bg: colors.infoMuted };
    }
  };

  const handleNotificationPress = async (item: NotificationItem) => {
    if (!item.is_read) {
      await markAsRead(item.id);
    }

    if (item.type === 'order') {
      router.push('/orders' as any);
    } else if (item.type === 'test_drive') {
      router.push('/(tabs)/profile' as any);
    } else if (item.type === 'promo') {
      router.push('/(tabs)/catalog' as any);
    }
  };

  const renderItem = ({ item }: { item: NotificationItem }) => {
    const iconConfig = getNotifIcon(item.type);
    const dateStr = new Date(item.created_at).toLocaleDateString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
    });

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => handleNotificationPress(item)}
      >
        <Card
          style={[
            styles.notifCard,
            !item.is_read ? styles.notifCardUnread : null,
          ]}
          padding={spacing.sm + 2}
        >
          <View style={[styles.iconCircle, { backgroundColor: iconConfig.bg }]}>
            <Ionicons name={iconConfig.icon} size={18} color={iconConfig.color} />
          </View>

          <View style={styles.notifContent}>
            <View style={styles.titleRow}>
              <Text
                style={[
                  styles.notifTitle,
                  !item.is_read && { fontWeight: typography.weights.bold },
                ]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              {!item.is_read && <View style={styles.unreadPill} />}
            </View>

            <Text style={styles.notifDesc} numberOfLines={2}>
              {item.content}
            </Text>

            <View style={styles.timeRow}>
              <Ionicons name="time-outline" size={10} color={colors.textMuted} style={{ marginRight: 3 }} />
              <Text style={styles.notifTime}>{dateStr}</Text>
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
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Thông Báo & Tin Nhắn</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => markAllAsRead()}
          style={styles.markAllBtn}
        >
          <Text style={styles.markAllText}>Đọc tất cả</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Strip */}
      <View style={styles.filterStrip}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setFilterUnreadOnly(false)}
          style={[
            styles.filterPill,
            !filterUnreadOnly && styles.filterPillActive,
          ]}
        >
          <Text
            style={[
              styles.filterPillText,
              !filterUnreadOnly && styles.filterPillTextActive,
            ]}
          >
            Tất cả ({notifications.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setFilterUnreadOnly(true)}
          style={[
            styles.filterPill,
            filterUnreadOnly && styles.filterPillActive,
          ]}
        >
          <Text
            style={[
              styles.filterPillText,
              filterUnreadOnly && styles.filterPillTextActive,
            ]}
          >
            Chưa đọc ({notifications.filter((n) => !n.is_read).length})
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải thông báo...</Text>
        </View>
      ) : displayedNotifications.length === 0 ? (
        <EmptyState
          icon="notifications-off-outline"
          title="Không có thông báo"
          description="Bạn đã đọc hết tất cả thông báo khuyến mãi và cập nhật đơn hàng."
        />
      ) : (
        <FlatList
          data={displayedNotifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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
  markAllBtn: {
    paddingVertical: 6,
    paddingHorizontal: spacing.xs,
  },
  markAllText: {
    color: colors.primaryHover,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  filterStrip: {
    flexDirection: 'row',
    paddingHorizontal: spacing['2xl'],
    paddingVertical: 8,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  filterPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceElevated,
  },
  filterPillActive: {
    backgroundColor: colors.primaryMuted,
  },
  filterPillText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  filterPillTextActive: {
    color: colors.primaryHover,
    fontWeight: typography.weights.semibold,
  },
  listContent: {
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.md,
    gap: spacing.md,
    paddingBottom: 40,
  },
  notifCard: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: radii.lg,
    ...shadows.sm,
  },
  notifCardUnread: {
    backgroundColor: 'rgba(59, 130, 246, 0.06)',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  notifContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notifTitle: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    lineHeight: 18,
    flex: 1,
  },
  unreadPill: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primaryHover,
    marginLeft: 8,
  },
  notifDesc: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    lineHeight: 18,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  notifTime: {
    color: colors.textMuted,
    fontSize: typography.sizes['2xs'] + 1,
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

