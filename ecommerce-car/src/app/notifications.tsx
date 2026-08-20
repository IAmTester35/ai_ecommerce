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
import { colors, radii, spacing, typography } from '../theme';
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
          padding={spacing.sm}
        >
          <View style={[styles.iconCircle, { backgroundColor: iconConfig.bg }]}>
            <Ionicons name={iconConfig.icon} size={15} color={iconConfig.color} />
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
        <View style={styles.headerInner}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={16} color={colors.text} />
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
      </View>

      {/* Filter Strip */}
      <View style={styles.filterStrip}>
        <View style={styles.filterStripInner}>
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
    paddingTop: 48,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  headerInner: {
    width: '100%',
    maxWidth: 900,
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
  markAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: spacing.xs,
  },
  markAllText: {
    color: colors.primaryHover,
    fontSize: 11,
    fontWeight: typography.weights.medium,
  },
  filterStrip: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  filterStripInner: {
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center',
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: 6,
    gap: spacing.xs,
  },
  filterPill: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radii.xs,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  filterPillActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: 'rgba(59, 130, 246, 0.35)',
  },
  filterPillText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: typography.weights.medium,
  },
  filterPillTextActive: {
    color: colors.primaryHover,
    fontWeight: typography.weights.semibold,
  },
  listContent: {
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.xs + 2,
    paddingBottom: 32,
  },
  notifCard: {
    flexDirection: 'row',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  notifCardUnread: {
    backgroundColor: 'rgba(37, 99, 235, 0.06)',
    borderColor: 'rgba(59, 130, 246, 0.25)',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  notifContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  notifTitle: {
    color: colors.text,
    fontSize: typography.sizes.xs + 0.5,
    fontWeight: typography.weights.medium,
    lineHeight: 16,
    flex: 1,
  },
  unreadPill: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primaryHover,
    marginLeft: 6,
  },
  notifDesc: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  notifTime: {
    color: colors.textMuted,
    fontSize: 10,
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
