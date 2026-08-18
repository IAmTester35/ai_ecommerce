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
                <Ionicons name="call-outline" size={11} color={colors.textSecondary} style={{ marginRight: 4 }} />
                <Text style={styles.membershipTier}>{profile.phone}</Text>
              </View>
            ) : null}
          </View>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.editProfileBtn}
            onPress={() => router.push('/(auth)/edit-profile' as any)}
          >
            <Ionicons name="create-outline" size={16} color={colors.primaryHover} />
          </TouchableOpacity>
        </View>
      ) : (
        /* Guest Welcome Card */
        <View style={styles.guestCard}>
          <View style={styles.guestHeaderRow}>
            <View style={styles.guestIconBox}>
              <Ionicons name="person-circle-outline" size={28} color={colors.primaryHover} />
            </View>
            <View style={styles.guestHeaderText}>
              <View style={styles.badgeLine}>
                <Badge label="TÀI KHOẢN KHÁCH" variant="secondary" size="xs" />
              </View>
              <Text style={styles.guestTitle}>Trải Nghiệm Đẳng Cấp</Text>
            </View>
          </View>
          <Text style={styles.guestDesc}>
            Đăng nhập để đồng bộ danh sách xe yêu thích, đặt lịch lái thử độc quyền và nhận tư vấn thông minh từ AI.
          </Text>

          <View style={styles.guestActionButtons}>
            <Button
              title="Đăng Nhập"
              size="md"
              variant="primary"
              onPress={() => router.push('/(auth)/login' as any)}
              style={styles.guestBtn}
              icon={<Ionicons name="log-in-outline" size={16} color="#FFFFFF" />}
            />
            <Button
              title="Đăng Ký"
              size="md"
              variant="secondary"
              onPress={() => router.push('/(auth)/register' as any)}
              style={styles.guestBtn}
              icon={<Ionicons name="person-add-outline" size={16} color={colors.text} />}
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
          <Ionicons name="bag-handle-outline" size={16} color={colors.primaryHover} />
          <Text style={styles.statLabel}>Giỏ Cọc</Text>
        </TouchableOpacity>
      </View>

      {/* 3. Active Test Drive Bookings (If Logged In) */}
      {user && (
        <>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleGroup}>
              <Ionicons name="calendar-outline" size={15} color={colors.primaryHover} style={{ marginRight: 6 }} />
              <Text style={styles.sectionTitle}>Lịch Lái Thử</Text>
            </View>
            <Badge label={`${testDrives.length} Lịch hẹn`} variant="primary" size="xs" />
          </View>

          {testDrives.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>Chưa có lịch hẹn lái thử nào.</Text>
              <Button
                title="Đăng ký trải nghiệm"
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
                    <View style={styles.dateInfoRow}>
                      <Ionicons name="time-outline" size={11} color={colors.primaryHover} style={{ marginRight: 3 }} />
                      <Text style={styles.bookingDate}>
                        {new Date(item.scheduled_date).toLocaleDateString('vi-VN', {
                          weekday: 'short',
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </Text>
                    </View>
                    {item.notes ? (
                      <Text style={styles.showroomText} numberOfLines={1}>
                        {item.notes}
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
                      style={{ height: 30 }}
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
              <Ionicons name="bookmark-outline" size={15} color={colors.primaryHover} style={{ marginRight: 6 }} />
              <Text style={styles.sectionTitle}>Xe Đã Lưu ({savedCars.length})</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/catalog' as any)}>
              <Text style={styles.seeAllText}>Xem thêm</Text>
            </TouchableOpacity>
          </View>

          {savedCars.length === 0 ? (
            <Card style={styles.emptyCard}>
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
                      <Ionicons name="trash-outline" size={12} color={colors.danger} />
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
        <Card style={styles.perksCard}>
          <Text style={styles.perksCardTitle}>Đặc Quyền Thành Viên AutoMatch</Text>
          <View style={styles.perkItem}>
            <View style={[styles.perkIconBox, { backgroundColor: colors.primaryMuted }]}>
              <Ionicons name="heart-outline" size={16} color={colors.primaryHover} />
            </View>
            <View style={styles.perkContent}>
              <Text style={styles.perkName}>Gara Lưu Trữ Đa Nền Tảng</Text>
              <Text style={styles.perkDesc}>Đồng bộ danh sách xe yêu thích và so sánh chi tiết tức thì.</Text>
            </View>
          </View>

          <View style={styles.perkItem}>
            <View style={[styles.perkIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
              <Ionicons name="car-sport-outline" size={16} color={colors.success} />
            </View>
            <View style={styles.perkContent}>
              <Text style={styles.perkName}>Đặt Lái Thử Độc Quyền</Text>
              <Text style={styles.perkDesc}>Trải nghiệm xe tại hệ thống showroom đối tác trên toàn quốc.</Text>
            </View>
          </View>

          <View style={styles.perkItem}>
            <View style={[styles.perkIconBox, { backgroundColor: colors.secondaryMuted }]}>
              <Ionicons name="sparkles-outline" size={16} color={colors.secondaryHover} />
            </View>
            <View style={styles.perkContent}>
              <Text style={styles.perkName}>Cá Nhân Hóa Với Trợ Lý AI</Text>
              <Text style={styles.perkDesc}>Tư vấn xe dựa trên tài chính, phong cách và thói quen lái xe của bạn.</Text>
            </View>
          </View>
        </Card>
      )}

      {/* 6. Settings & Support Services */}
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionTitleGroup}>
          <Ionicons name="settings-outline" size={15} color={colors.primaryHover} style={{ marginRight: 6 }} />
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
            <Ionicons name="receipt-outline" size={16} color={colors.primaryHover} />
          </View>
          <View style={styles.settingTextGroup}>
            <Text style={styles.settingTitle}>Đơn hàng & Đặt cọc</Text>
            <Text style={styles.settingSubtitle}>Theo dõi tiến độ hợp đồng và thanh toán</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.settingItem}
          onPress={() => router.push('/cart' as any)}
        >
          <View style={[styles.settingIconBox, { backgroundColor: colors.secondaryMuted }]}>
            <Ionicons name="bag-handle-outline" size={16} color={colors.secondaryHover} />
          </View>
          <View style={styles.settingTextGroup}>
            <Text style={styles.settingTitle}>Giỏ hàng cọc xe</Text>
            <Text style={styles.settingSubtitle}>Quản lý danh sách xe chuẩn bị đặt cọc</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.settingItem}
          onPress={() => router.push('/notifications' as any)}
        >
          <View style={[styles.settingIconBox, { backgroundColor: colors.conflictMuted }]}>
            <Ionicons name="notifications-outline" size={16} color={colors.conflict} />
          </View>
          <View style={styles.settingTextGroup}>
            <Text style={styles.settingTitle}>Thông báo hệ thống</Text>
            <Text style={styles.settingSubtitle}>Cập nhật trạng thái đơn hàng & ưu đãi</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.settingItem}
          onPress={() => router.push('/(tabs)/ai-chat' as any)}
        >
          <View style={[styles.settingIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
            <Ionicons name="sparkles-outline" size={16} color={colors.success} />
          </View>
          <View style={styles.settingTextGroup}>
            <Text style={styles.settingTitle}>Trợ lý AutoMatch AI</Text>
            <Text style={styles.settingSubtitle}>Tư vấn mua xe thông minh 24/7</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
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
                <Ionicons name="person-outline" size={16} color={colors.primaryHover} />
              </View>
              <View style={styles.settingTextGroup}>
                <Text style={styles.settingTitle}>Chỉnh sửa thông tin</Text>
                <Text style={styles.settingSubtitle}>Cập nhật họ tên và số điện thoại</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.settingItem}
              onPress={() => router.push('/(auth)/change-password' as any)}
            >
              <View style={[styles.settingIconBox, { backgroundColor: 'rgba(99, 102, 241, 0.12)' }]}>
                <Ionicons name="key-outline" size={16} color={colors.secondaryHover} />
              </View>
              <View style={styles.settingTextGroup}>
                <Text style={styles.settingTitle}>Đổi mật khẩu</Text>
                <Text style={styles.settingSubtitle}>Thiết lập mật khẩu bảo mật mới</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.settingItem}
              onPress={handleSignOut}
            >
              <View style={[styles.settingIconBox, { backgroundColor: colors.dangerMuted }]}>
                <Ionicons name="log-out-outline" size={16} color={colors.danger} />
              </View>
              <Text style={[styles.settingTitle, { color: colors.danger }]}>Đăng xuất tài khoản</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={{ height: 32 }} />
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
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    ...shadows.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderHighlight,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.base,
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
    fontSize: typography.sizes.sm + 1,
    fontWeight: typography.weights.semibold,
    flex: 1,
    marginRight: 6,
  },
  userEmail: {
    color: colors.textSecondary,
    fontSize: typography.sizes['2xs'] + 1,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  membershipTier: {
    color: colors.textSecondary,
    fontSize: typography.sizes['2xs'],
  },
  editProfileBtn: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
  guestCard: {
    marginTop: 48,
    marginBottom: spacing.md,
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.borderHighlight,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md + 2,
    ...shadows.glowCyan,
  },
  guestHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  guestIconBox: {
    width: 40,
    height: 40,
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
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
  guestDesc: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    lineHeight: 18,
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
  },
  perksCardTitle: {
    color: colors.text,
    fontSize: typography.sizes.xs + 2,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.md,
  },
  perkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm + 2,
  },
  perkIconBox: {
    width: 32,
    height: 32,
    borderRadius: radii.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  perkContent: {
    flex: 1,
  },
  perkName: {
    color: colors.text,
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.medium,
  },
  perkDesc: {
    color: colors.textSecondary,
    fontSize: typography.sizes['2xs'],
    marginTop: 1,
    lineHeight: 14,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingVertical: spacing.sm + 2,
    marginBottom: spacing.lg,
    alignItems: 'center',
    justifyContent: 'space-around',
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
    fontSize: typography.sizes['2xs'],
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: colors.border,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xs + 2,
  },
  sectionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.sizes.xs + 2,
    fontWeight: typography.weights.semibold,
  },
  seeAllText: {
    color: colors.primaryHover,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  emptyCard: {
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
  },
  bookingCard: {
    marginBottom: spacing.sm,
    padding: spacing.sm + 2,
  },
  bookingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  carThumb: {
    width: 54,
    height: 38,
    borderRadius: radii.xs,
    marginRight: spacing.sm + 2,
  },
  bookingDetails: {
    flex: 1,
    gap: 1,
  },
  bookingCarName: {
    color: colors.text,
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.semibold,
  },
  dateInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookingDate: {
    color: colors.primaryHover,
    fontSize: typography.sizes['2xs'],
    fontWeight: typography.weights.medium,
  },
  showroomText: {
    color: colors.textMuted,
    fontSize: typography.sizes['2xs'],
  },
  bookingActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing.xs + 2,
    marginTop: spacing.xs + 2,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  savedScroll: {
    paddingBottom: spacing.sm,
  },
  savedCarCard: {
    width: 140,
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.sm,
    marginRight: spacing.sm,
    overflow: 'hidden',
  },
  savedCarImg: {
    width: '100%',
    height: 80,
  },
  savedCarContent: {
    padding: spacing.xs + 2,
  },
  savedCarTitle: {
    color: colors.text,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  savedCarPrice: {
    color: colors.primaryHover,
    fontSize: typography.sizes['2xs'] + 1,
    fontWeight: typography.weights.bold,
    marginTop: 1,
    marginBottom: 4,
  },
  unsaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  unsaveText: {
    color: colors.danger,
    fontSize: 10,
    fontWeight: typography.weights.medium,
  },
  settingsList: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: spacing.sm,
  },
  settingIconBox: {
    width: 32,
    height: 32,
    borderRadius: radii.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTextGroup: {
    flex: 1,
  },
  settingTitle: {
    color: colors.text,
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.semibold,
  },
  settingSubtitle: {
    color: colors.textMuted,
    fontSize: typography.sizes['2xs'],
    marginTop: 1,
  },
});
