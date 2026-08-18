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
        return { icon: 'receipt-outline' as const, color: colors.primary, bg: colors.primaryMuted };
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
        >
          <View style={[styles.iconCircle, { backgroundColor: iconConfig.bg }]}>
            <Ionicons name={iconConfig.icon} size={20} color={iconConfig.color} />
          </View>

          <View style={styles.notifContent}>
            <View style={styles.titleRow}>
              <Text
                style={[
                  styles.notifTitle,
                  !item.is_read && { fontWeight: typography.weights.extrabold },
                ]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              {!item.is_read && <View style={styles.unreadPill} />}
            </View>

            <Text style={styles.notifDesc} numberOfLines={3}>
              {item.content}
            </Text>

            <Text style={styles.notifTime}>⏰ {dateStr}</Text>
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
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải thông báo từ Supabase...</Text>
        </View>
      ) : displayedNotifications.length === 0 ? (
        <EmptyState
          icon="notifications-off-outline"
          title="Không Có Thông Báo Nào"
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
  markAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
  },
  markAllText: {
    color: colors.primary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  filterStrip: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  filterPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterPillActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  filterPillText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  filterPillTextActive: {
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
  listContent: {
    padding: spacing.lg,
    gap: spacing.sm,
    paddingBottom: 40,
  },
  notifCard: {
    flexDirection: 'row',
    padding: spacing.md,
    ...shadows.sm,
  },
  notifCardUnread: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(0, 229, 255, 0.03)',
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
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
    fontWeight: typography.weights.bold,
    flex: 1,
  },
  unreadPill: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: 6,
  },
  notifDesc: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    lineHeight: 17,
  },
  notifTime: {
    color: colors.textMuted,
    fontSize: typography.sizes['2xs'],
    marginTop: 6,
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
