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
import { colors, radii, spacing, typography } from '../../theme';
import { useAuthStore } from '../../store/useAuthStore';
import { useTestDriveStore } from '../../store/useTestDriveStore';
import { useCarStore } from '../../store/useCarStore';
import { useOrderStore } from '../../store/useOrderStore';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { formatVndPrice } from '../../components/ui/PriceTag';
import { FALLBACK_CAR_URL } from '../../constants/images';

export default function ProfileScreen() {
  const { user, profile, signOut } = useAuthStore();
  const { testDrives, fetchTestDrives, cancelTestDrive } = useTestDriveStore();
  const { savedCars, fetchSavedCars, toggleSaveCar } = useCarStore();
  const { orders, fetchOrders } = useOrderStore();

  useEffect(() => {
    if (user) {
      fetchTestDrives();
      fetchSavedCars(user.id);
      fetchOrders(user.id);
    }
  }, [user, fetchTestDrives, fetchSavedCars, fetchOrders]);

  const fallbackImage = FALLBACK_CAR_URL;

  const userInitials = profile?.full_name
    ? profile.full_name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
    : (user?.email?.slice(0, 2).toUpperCase() || 'U');

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

  const handleSignOut = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            await signOut();
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 1. Header: Authenticated vs Guest */}
      {user ? (
        /* Authenticated User Header Card */
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userInitials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.userName} numberOfLines={1}>
                {profile?.full_name || 'Khách Hàng AutoMatch'}
              </Text>
              <Badge
                label={
                  profile?.role === 'owner'
                    ? 'Chủ Showroom'
                    : profile?.role === 'manager'
                      ? 'Quản Lý'
                      : 'Thành Viên'
                }
                variant={profile?.role === 'owner' ? 'gold' : profile?.role === 'manager' ? 'primary' : 'secondary'}
                size="xs"
              />
            </View>
            <Text style={styles.userEmail} numberOfLines={1}>{user.email}</Text>
            {profile?.phone ? (
              <View style={styles.phoneRow}>
                <Ionicons name="call-outline" size={10} color={colors.textSecondary} style={{ marginRight: 3 }} />
                <Text style={styles.membershipTier}>{profile.phone}</Text>
              </View>
            ) : null}
          </View>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.editProfileBtn}
            onPress={() => router.push('/(auth)/edit-profile' as any)}
          >
            <Ionicons name="create-outline" size={15} color={colors.primaryHover} />
          </TouchableOpacity>
        </View>
      ) : (
        /* Guest Welcome Card */
        <View style={styles.guestCard}>
          <View style={styles.guestHeaderRow}>
            <View style={styles.guestIconBox}>
              <Ionicons name="person-circle-outline" size={24} color={colors.primaryHover} />
            </View>
            <View style={styles.guestHeaderText}>
              <View style={styles.badgeLine}>
                <Badge label="TÀI KHOẢN KHÁCH" variant="secondary" size="xs" />
              </View>
              <Text style={styles.guestTitle}>Trải Nghiệm AutoMatch</Text>
            </View>
          </View>
          <Text style={styles.guestDesc}>
            Đăng nhập để đồng bộ gara xe yêu thích, đặt lịch lái thử độc quyền và nhận tư vấn thông minh từ AI.
          </Text>

          <View style={styles.guestActionButtons}>
            <Button
              title="Đăng Nhập"
              size="sm"
              variant="primary"
              onPress={() => router.push('/(auth)/login' as any)}
              style={styles.guestBtn}
              icon={<Ionicons name="log-in-outline" size={14} color="#FFFFFF" />}
            />
            <Button
              title="Đăng Ký"
              size="sm"
              variant="secondary"
              onPress={() => router.push('/(auth)/register' as any)}
              style={styles.guestBtn}
              icon={<Ionicons name="person-add-outline" size={14} color={colors.text} />}
            />
          </View>
        </View>
      )}

      {/* 2. Quick Statistics Strip */}
      <View style={styles.statsRow}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.statItem}
          onPress={() => {
            if (!user) {
              router.push('/(auth)/login' as any);
            } else {
              router.push('/orders' as any);
            }
          }}
        >
          <Text style={styles.statNumber}>{user ? orders.length : 0}</Text>
          <Text style={styles.statLabel}>Đơn Hàng</Text>
        </TouchableOpacity>

        <View style={styles.statDivider} />

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.statItem}
          onPress={() => {
            if (!user) {
              router.push('/(auth)/login' as any);
            }
          }}
        >
          <Text style={styles.statNumber}>{user ? testDrives.length : 0}</Text>
          <Text style={styles.statLabel}>Lái Thử</Text>
        </TouchableOpacity>

        <View style={styles.statDivider} />

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.statItem}
          onPress={() => {
            if (!user) {
              router.push('/(auth)/login' as any);
            }
          }}
        >
          <Text style={styles.statNumber}>{user ? savedCars.length : 0}</Text>
          <Text style={styles.statLabel}>Xe Đã Lưu</Text>
        </TouchableOpacity>

        <View style={styles.statDivider} />

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.statItem}
          onPress={() => router.push('/cart' as any)}
        >
          <Ionicons name="bag-handle-outline" size={15} color={colors.primaryHover} />
          <Text style={styles.statLabel}>Giỏ Cọc</Text>
        </TouchableOpacity>
      </View>

      {/* 3. Active Test Drive Bookings (If Logged In) */}
      {user && (
        <>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleGroup}>
              <Ionicons name="calendar-outline" size={14} color={colors.primaryHover} style={{ marginRight: 6 }} />
              <Text style={styles.sectionTitle}>Lịch Lái Thử</Text>
            </View>
            <Badge label={`${testDrives.length} Lịch hẹn`} variant="primary" size="xs" />
          </View>

          {testDrives.length === 0 ? (
            <Card style={styles.emptyCard} padding={spacing.md}>
              <Text style={styles.emptyText}>Chưa có lịch hẹn lái thử nào.</Text>
            </Card>
          ) : (
            testDrives.map((item) => (
              <Card key={item.id} style={styles.bookingCard} padding={spacing.sm}>
                <View style={styles.bookingHeader}>
                  <Image
                    source={{ uri: item.car?.image_url || fallbackImage }}
                    style={styles.carThumb}
                    contentFit="cover"
                  />
                  <View style={styles.bookingDetails}>
                    <Text style={styles.bookingCarName} numberOfLines={1}>
                      {item.car ? `${item.car.make} ${item.car.model}` : 'Mẫu xe AutoMatch'}
                    </Text>
                    <View style={styles.dateInfoRow}>
                      <Ionicons name="time-outline" size={10} color={colors.primaryHover} style={{ marginRight: 3 }} />
                      <Text style={styles.bookingDate}>
                        {new Date(item.scheduled_date).toLocaleDateString('vi-VN', {
                          weekday: 'short',
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </Text>
                    </View>
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

                {item.status !== 'cancelled' && (
                  <View style={styles.bookingActions}>
                    <Button
                      title="Hủy Lịch"
                      size="sm"
                      variant="ghost"
                      textStyle={{ color: colors.danger, fontSize: 10 }}
                      onPress={() => handleCancelTestDrive(item.id)}
                    />
                    <Button
                      title="Chi tiết xe"
                      size="sm"
                      variant="outline"
                      onPress={() => router.push(`/car/${item.car_id}` as any)}
                      style={{ height: 28 }}
                    />
                  </View>
                )}
              </Card>
            ))
          )}
        </>
      )}

      {/* 4. Saved Wishlist Cars (If Logged In) */}
      {user && (
        <>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleGroup}>
              <Ionicons name="bookmark-outline" size={14} color={colors.primaryHover} style={{ marginRight: 6 }} />
              <Text style={styles.sectionTitle}>Xe Đã Lưu ({savedCars.length})</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/catalog' as any)}>
              <Text style={styles.seeAllText}>Xem thêm</Text>
            </TouchableOpacity>
          </View>

          {savedCars.length === 0 ? (
            <Card style={styles.emptyCard} padding={spacing.md}>
              <Text style={styles.emptyText}>Chưa có xe nào trong danh sách đã lưu.</Text>
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
                      <Ionicons name="trash-outline" size={11} color={colors.danger} />
                      <Text style={styles.unsaveText}>Xóa</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </>
      )}

      {/* 5. Member Privileges Highlight (For Guests) */}
      {!user && (
        <Card style={styles.perksCard} padding={spacing.md}>
          <Text style={styles.perksCardTitle}>Đặc Quyền Thành Viên</Text>
          <View style={styles.perkItem}>
            <View style={[styles.perkIconBox, { backgroundColor: colors.primaryMuted }]}>
              <Ionicons name="heart-outline" size={14} color={colors.primaryHover} />
            </View>
            <View style={styles.perkContent}>
              <Text style={styles.perkName}>Gara Lưu Trữ</Text>
              <Text style={styles.perkDesc}>Đồng bộ danh sách xe yêu thích và so sánh chi tiết tức thì.</Text>
            </View>
          </View>

          <View style={styles.perkItem}>
            <View style={[styles.perkIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
              <Ionicons name="car-sport-outline" size={14} color={colors.success} />
            </View>
            <View style={styles.perkContent}>
              <Text style={styles.perkName}>Lái Thử Độc Quyền</Text>
              <Text style={styles.perkDesc}>Trải nghiệm xe tại hệ thống đối tác toàn quốc.</Text>
            </View>
          </View>
        </Card>
      )}

      {/* 6. Settings & Support Services */}
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionTitleGroup}>
          <Ionicons name="settings-outline" size={14} color={colors.primaryHover} style={{ marginRight: 6 }} />
          <Text style={styles.sectionTitle}>Dịch Vụ & Cài Đặt</Text>
        </View>
      </View>
      <View style={styles.settingsList}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.settingItem}
          onPress={() => {
            if (!user) {
              router.push('/(auth)/login' as any);
            } else {
              router.push('/orders' as any);
            }
          }}
        >
          <View style={[styles.settingIconBox, { backgroundColor: colors.primaryMuted }]}>
            <Ionicons name="receipt-outline" size={15} color={colors.primaryHover} />
          </View>
          <View style={styles.settingTextGroup}>
            <Text style={styles.settingTitle}>Đơn hàng & Đặt cọc</Text>
            <Text style={styles.settingSubtitle}>Theo dõi tiến độ hợp đồng và thanh toán</Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.settingItem}
          onPress={() => router.push('/cart' as any)}
        >
          <View style={[styles.settingIconBox, { backgroundColor: colors.secondaryMuted }]}>
            <Ionicons name="bag-handle-outline" size={15} color={colors.secondaryHover} />
          </View>
          <View style={styles.settingTextGroup}>
            <Text style={styles.settingTitle}>Giỏ hàng cọc xe</Text>
            <Text style={styles.settingSubtitle}>Danh sách xe giữ chỗ</Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.settingItem}
          onPress={() => router.push('/notifications' as any)}
        >
          <View style={[styles.settingIconBox, { backgroundColor: colors.conflictMuted }]}>
            <Ionicons name="notifications-outline" size={15} color={colors.conflict} />
          </View>
          <View style={styles.settingTextGroup}>
            <Text style={styles.settingTitle}>Thông báo hệ thống</Text>
            <Text style={styles.settingSubtitle}>Cập nhật trạng thái đơn hàng & ưu đãi</Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.settingItem}
          onPress={() => router.push('/(tabs)/ai-chat' as any)}
        >
          <View style={[styles.settingIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
            <Ionicons name="sparkles-outline" size={15} color={colors.success} />
          </View>
          <View style={styles.settingTextGroup}>
            <Text style={styles.settingTitle}>Trợ lý AutoMatch AI</Text>
            <Text style={styles.settingSubtitle}>Tư vấn mua xe thông minh 24/7</Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Member-Only Options */}
        {user && (
          <>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.settingItem}
              onPress={() => router.push('/(auth)/edit-profile' as any)}
            >
              <View style={[styles.settingIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
                <Ionicons name="person-outline" size={15} color={colors.primaryHover} />
              </View>
              <View style={styles.settingTextGroup}>
                <Text style={styles.settingTitle}>Chỉnh sửa thông tin</Text>
                <Text style={styles.settingSubtitle}>Cập nhật họ tên và số điện thoại</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.settingItem}
              onPress={() => router.push('/(auth)/change-password' as any)}
            >
              <View style={[styles.settingIconBox, { backgroundColor: 'rgba(99, 102, 241, 0.12)' }]}>
                <Ionicons name="key-outline" size={15} color={colors.secondaryHover} />
              </View>
              <View style={styles.settingTextGroup}>
                <Text style={styles.settingTitle}>Đổi mật khẩu</Text>
                <Text style={styles.settingSubtitle}>Thiết lập mật khẩu bảo mật</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.settingItem}
              onPress={handleSignOut}
            >
              <View style={[styles.settingIconBox, { backgroundColor: colors.dangerMuted }]}>
                <Ionicons name="log-out-outline" size={15} color={colors.danger} />
              </View>
              <Text style={[styles.settingTitle, { color: colors.danger }]}>Đăng xuất tài khoản</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={{ height: 24 }} />
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
    marginTop: 48,
    marginBottom: spacing.md,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm + 2,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userName: {
    color: colors.text,
    fontSize: typography.sizes.sm + 0.5,
    fontWeight: typography.weights.semibold,
    lineHeight: 18,
    flex: 1,
    marginRight: 6,
  },
  userEmail: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  membershipTier: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  editProfileBtn: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
  guestCard: {
    marginTop: 48,
    marginBottom: spacing.md,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
  },
  guestHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs + 2,
  },
  guestIconBox: {
    width: 38,
    height: 38,
    borderRadius: radii.sm,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm + 2,
  },
  guestHeaderText: {
    flex: 1,
  },
  badgeLine: {
    marginBottom: 2,
  },
  guestTitle: {
    color: colors.text,
    fontSize: typography.sizes.sm + 1,
    fontWeight: typography.weights.bold,
    lineHeight: 20,
  },
  guestDesc: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    marginBottom: spacing.md,
  },
  guestActionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  guestBtn: {
    flex: 1,
    height: 38,
  },
  perksCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  perksCardTitle: {
    color: colors.text,
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.semibold,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  perkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  perkIconBox: {
    width: 30,
    height: 30,
    borderRadius: radii.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  perkContent: {
    flex: 1,
  },
  perkName: {
    color: colors.text,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  perkDesc: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 1,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    paddingVertical: spacing.sm + 2,
    marginBottom: spacing.md,
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    color: colors.primaryHover,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  sectionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.semibold,
    lineHeight: 18,
  },
  seeAllText: {
    color: colors.primaryHover,
    fontSize: 11,
    fontWeight: typography.weights.medium,
  },
  emptyCard: {
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 11,
  },
  bookingCard: {
    marginBottom: spacing.xs + 2,
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  bookingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  carThumb: {
    width: 50,
    height: 35,
    borderRadius: radii.xs,
    marginRight: spacing.sm,
  },
  bookingDetails: {
    flex: 1,
    gap: 1,
  },
  bookingCarName: {
    color: colors.text,
    fontSize: 11,
    fontWeight: typography.weights.semibold,
  },
  dateInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookingDate: {
    color: colors.primaryHover,
    fontSize: 10,
    fontWeight: typography.weights.medium,
  },
  bookingActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 6,
    paddingTop: 4,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  savedScroll: {
    paddingVertical: 4,
    gap: spacing.sm,
  },
  savedCarCard: {
    width: 140,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  savedCarImg: {
    width: '100%',
    height: 75,
  },
  savedCarContent: {
    padding: 6,
  },
  savedCarTitle: {
    color: colors.text,
    fontSize: 11,
    fontWeight: typography.weights.semibold,
  },
  savedCarPrice: {
    color: colors.primaryHover,
    fontSize: 11,
    fontWeight: typography.weights.bold,
    marginTop: 2,
  },
  unsaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
  },
  unsaveText: {
    color: colors.danger,
    fontSize: 10,
  },
  settingsList: {
    gap: 4,
    marginBottom: spacing.md,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  settingIconBox: {
    width: 32,
    height: 32,
    borderRadius: radii.xs,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  settingTextGroup: {
    flex: 1,
  },
  settingTitle: {
    color: colors.text,
    fontSize: typography.sizes.xs + 0.5,
    fontWeight: typography.weights.medium,
  },
  settingSubtitle: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 1,
  },
});
