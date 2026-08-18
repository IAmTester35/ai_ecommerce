import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, radii, spacing, typography, shadows } from '../../theme';
import { useAuthStore } from '../../store/useAuthStore';
import { useTestDriveStore } from '../../store/useTestDriveStore';
import { useCarStore } from '../../store/useCarStore';
import { useOrderStore } from '../../store/useOrderStore';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { formatVndPrice } from '../../components/ui/PriceTag';

export default function ProfileScreen() {
  const { user, profile, signOut } = useAuthStore();
  const { testDrives, fetchTestDrives, cancelTestDrive } = useTestDriveStore();
  const { savedCars, fetchSavedCars, toggleSaveCar } = useCarStore();
  const { orders, fetchOrders } = useOrderStore();

  useEffect(() => {
    fetchTestDrives();
    fetchSavedCars(user?.id);
    fetchOrders(user?.id);
  }, [user, fetchTestDrives, fetchSavedCars, fetchOrders]);

  const fallbackImage =
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=800';

  const userInitials = profile?.full_name
    ? profile.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  const handleCancelTestDrive = async (tdId: string) => {
    Alert.alert(
      'Hủy Lịch Lái Thử',
      'Bạn có chắc chắn muốn hủy lịch hẹn lái thử này?',
      [
        { text: 'Giữ lại', style: 'cancel' },
        {
          text: 'Hủy lịch',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelTestDrive(tdId);
              Alert.alert('Đã hủy', 'Lịch lái thử đã được hủy thành công.');
            } catch (err: any) {
              Alert.alert('Lỗi', err.message || 'Không thể hủy lúc này.');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* VIP Profile Card Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{userInitials}</Text>
        </View>
        <View style={styles.profileInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.userName}>
              {profile?.full_name || 'Khách Hàng AutoMatch'}
            </Text>
            <Badge
              label={profile?.role === 'owner' ? 'Chủ Showroom' : profile?.role === 'manager' ? 'Quản Lý' : 'Thành Viên'}
              variant={profile?.role === 'owner' ? 'gold' : profile?.role === 'manager' ? 'primary' : 'secondary'}
              size="xs"
            />
          </View>
          <Text style={styles.userEmail}>{user?.email || 'khachhang@automatch.ai'}</Text>
          {profile?.phone ? (
            <Text style={styles.membershipTier}>📞 {profile.phone}</Text>
          ) : null}
        </View>
      </View>

      {/* Quick Statistics Strip */}
      <View style={styles.statsRow}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.statItem}
          onPress={() => router.push('/orders' as any)}
        >
          <Text style={styles.statNumber}>{orders.length}</Text>
          <Text style={styles.statLabel}>Đơn Hàng</Text>
        </TouchableOpacity>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{testDrives.length}</Text>
          <Text style={styles.statLabel}>Lái Thử</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{savedCars.length}</Text>
          <Text style={styles.statLabel}>Xe Đã Lưu</Text>
        </View>

        <View style={styles.statDivider} />

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.statItem}
          onPress={() => router.push('/cart' as any)}
        >
          <Ionicons name="cart" size={18} color={colors.primary} />
          <Text style={styles.statLabel}>Giỏ Cọc</Text>
        </TouchableOpacity>
      </View>

      {/* Active Test Drive Bookings */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>🚗 Lịch Lái Thử Đã Đặt</Text>
        <Badge label={`${testDrives.length} Lịch hẹn`} variant="primary" size="xs" />
      </View>

      {testDrives.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>Bạn chưa có lịch hẹn lái thử nào.</Text>
          <Button
            title="Đăng Ký Lái Thử Ngay"
            size="sm"
            variant="outline"
            onPress={() => router.push('/(tabs)/catalog' as any)}
            style={{ marginTop: spacing.sm }}
          />
        </Card>
      ) : (
        testDrives.map((item) => (
          <Card key={item.id} style={styles.bookingCard}>
            <View style={styles.bookingHeader}>
              <Image
                source={{ uri: item.car?.image_url || fallbackImage }}
                style={styles.carThumb}
                contentFit="cover"
              />
              <View style={styles.bookingDetails}>
                <Text style={styles.bookingCarName}>
                  {item.car ? `${item.car.make} ${item.car.model}` : 'Mẫu xe AutoMatch'}
                </Text>
                <Text style={styles.bookingDate}>
                  ⏰ {new Date(item.scheduled_date).toLocaleDateString('vi-VN', {
                    weekday: 'short',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </Text>
                {item.notes ? (
                  <Text style={styles.showroomText} numberOfLines={1}>
                    📝 {item.notes}
                  </Text>
                ) : null}
              </View>

              <Badge
                label={
                  item.status === 'confirmed'
                    ? 'Đã Duyệt'
                    : item.status === 'cancelled'
                    ? 'Đã Hủy'
                    : 'Chờ Duyệt'
                }
                variant={
                  item.status === 'confirmed'
                    ? 'success'
                    : item.status === 'cancelled'
                    ? 'danger'
                    : 'warning'
                }
                size="xs"
              />
            </View>

            {item.notes && <Text style={styles.notesText}>📝 {item.notes}</Text>}

            {item.status !== 'cancelled' && (
              <View style={styles.bookingActions}>
                <Button
                  title="Hủy Lịch"
                  size="sm"
                  variant="ghost"
                  textStyle={{ color: colors.danger, fontSize: 11 }}
                  onPress={() => handleCancelTestDrive(item.id)}
                />
                <Button
                  title="Xem Chi Tiết Xe"
                  size="sm"
                  variant="outline"
                  onPress={() => router.push(`/car/${item.car_id}` as any)}
                  style={{ height: 32 }}
                />
              </View>
            )}
          </Card>
        ))
      )}

      {/* Saved Wishlist Cars */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>🔖 Danh Sách Xe Đã Lưu ({savedCars.length})</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/catalog' as any)}>
          <Text style={styles.seeAllText}>Xem Thêm</Text>
        </TouchableOpacity>
      </View>

      {savedCars.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>Chưa có xe nào trong danh sách yêu thích.</Text>
        </Card>
      ) : (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={savedCars}
          keyExtractor={(sc) => sc.id}
          contentContainerStyle={styles.savedScroll}
          renderItem={({ item: sc }) => (
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.savedCarCard}
              onPress={() => router.push(`/car/${sc.car_id}` as any)}
            >
              <Image
                source={{ uri: sc.car?.image_url || fallbackImage }}
                style={styles.savedCarImg}
                contentFit="cover"
              />
              <View style={styles.savedCarContent}>
                <Text style={styles.savedCarTitle} numberOfLines={1}>
                  {sc.car ? `${sc.car.make} ${sc.car.model}` : 'Xe AutoMatch'}
                </Text>
                <Text style={styles.savedCarPrice}>
                  {formatVndPrice(sc.car?.price)}
                </Text>
                <TouchableOpacity
                  style={styles.unsaveBtn}
                  onPress={() => toggleSaveCar(sc.car_id, user?.id)}
                >
                  <Ionicons name="trash-outline" size={14} color={colors.danger} />
                  <Text style={styles.unsaveText}>Xóa</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Settings & Support Services */}
      <Text style={styles.sectionTitle}>⚙️ Dịch Vụ & Cài Đặt</Text>
      <View style={styles.settingsList}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.settingItem}
          onPress={() => router.push('/orders' as any)}
        >
          <View style={[styles.settingIconBox, { backgroundColor: colors.primaryMuted }]}>
            <Ionicons name="receipt-outline" size={18} color={colors.primary} />
          </View>
          <View style={styles.settingTextGroup}>
            <Text style={styles.settingTitle}>Đơn Hàng & Lịch Sử Thanh Toán</Text>
            <Text style={styles.settingSubtitle}>Theo dõi tiến độ cọc & hợp đồng điện tử ZaloPay</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.settingItem}
          onPress={() => router.push('/cart' as any)}
        >
          <View style={[styles.settingIconBox, { backgroundColor: colors.secondaryMuted }]}>
            <Ionicons name="cart-outline" size={18} color={colors.secondary} />
          </View>
          <View style={styles.settingTextGroup}>
            <Text style={styles.settingTitle}>Giỏ Hàng Đặt Cọc</Text>
            <Text style={styles.settingSubtitle}>Quản lý các xe đang chuẩn bị ký hợp đồng</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.settingItem}
          onPress={() => router.push('/notifications' as any)}
        >
          <View style={[styles.settingIconBox, { backgroundColor: colors.conflictMuted }]}>
            <Ionicons name="notifications-outline" size={18} color={colors.conflict} />
          </View>
          <View style={styles.settingTextGroup}>
            <Text style={styles.settingTitle}>Trung Tâm Thông Báo</Text>
            <Text style={styles.settingSubtitle}>Ưu đãi khuyến mãi & cập nhật trạng thái đơn</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.settingItem}
          onPress={() => router.push('/(tabs)/ai-chat' as any)}
        >
          <View style={[styles.settingIconBox, { backgroundColor: 'rgba(0, 230, 118, 0.15)' }]}>
            <Ionicons name="sparkles-outline" size={18} color={colors.success} />
          </View>
          <View style={styles.settingTextGroup}>
            <Text style={styles.settingTitle}>Trợ Lý AutoMatch RAG</Text>
            <Text style={styles.settingSubtitle}>Tư vấn xe dựa trên AI Vector & Gemini</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {user && (
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.settingItem}
            onPress={signOut}
          >
            <View style={[styles.settingIconBox, { backgroundColor: colors.dangerMuted }]}>
              <Ionicons name="log-out-outline" size={18} color={colors.danger} />
            </View>
            <Text style={[styles.settingTitle, { color: colors.danger }]}>Đăng Xuất Tài Khoản</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 52,
    marginBottom: spacing.lg,
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.xl,
    padding: spacing.lg,
    ...shadows.sm,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    color: colors.textDark,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.extrabold,
  },
  profileInfo: {
    flex: 1,
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userName: {
    color: colors.text,
    fontSize: typography.sizes.base + 1,
    fontWeight: typography.weights.bold,
    flex: 1,
    marginRight: 6,
  },
  userEmail: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
  },
  membershipTier: {
    color: colors.conflict,
    fontSize: typography.sizes['2xs'],
    fontWeight: typography.weights.semibold,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.xl,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    color: colors.primary,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.extrabold,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.sizes.base + 1,
    fontWeight: typography.weights.bold,
  },
  seeAllText: {
    color: colors.primary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  emptyCard: {
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs + 1,
  },
  bookingCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  bookingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  carThumb: {
    width: 60,
    height: 45,
    borderRadius: radii.sm,
    marginRight: spacing.md,
  },
  bookingDetails: {
    flex: 1,
    gap: 2,
  },
  bookingCarName: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  bookingDate: {
    color: colors.primary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  showroomText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
  },
  notesText: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    fontStyle: 'italic',
    marginTop: spacing.xs + 2,
  },
  bookingActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  savedScroll: {
    paddingBottom: spacing.lg,
  },
  savedCarCard: {
    width: 160,
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    marginRight: spacing.md,
    overflow: 'hidden',
  },
  savedCarImg: {
    width: '100%',
    height: 95,
  },
  savedCarContent: {
    padding: spacing.sm,
  },
  savedCarTitle: {
    color: colors.text,
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.bold,
  },
  savedCarPrice: {
    color: colors.primary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    marginTop: 2,
    marginBottom: 6,
  },
  unsaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  unsaveText: {
    color: colors.danger,
    fontSize: typography.sizes['2xs'],
    fontWeight: typography.weights.semibold,
  },
  settingsList: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.xl,
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  settingIconBox: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTextGroup: {
    flex: 1,
  },
  settingTitle: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  settingSubtitle: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
});
