import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '../../src/theme/colors';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useTestDriveStore } from '../../src/store/useTestDriveStore';
import { useCarStore } from '../../src/store/useCarStore';
import { Badge } from '../../src/components/ui/Badge';
import { Card } from '../../src/components/ui/Card';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const { user, profile, signOut } = useAuthStore();
  const { testDrives, fetchTestDrives } = useTestDriveStore();
  const { savedCars, fetchSavedCars } = useCarStore();

  useEffect(() => {
    fetchTestDrives();
    if (user?.id) {
      fetchSavedCars(user.id);
    }
  }, [user, fetchTestDrives, fetchSavedCars]);

  const fallbackImage = 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=800';

  const userInitials = profile?.full_name
    ? profile.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'G';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{userInitials}</Text>
        </View>
        <View style={styles.profileInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.userName}>{profile?.full_name || user?.email || 'Khách Hàng VIP'}</Text>
            <Badge label={profile?.role || 'User'} variant="primary" size="sm" />
          </View>
          <Text style={styles.userEmail}>{user?.email || 'Chưa đăng nhập'}</Text>
        </View>
      </View>

      {/* Stats Summary Card */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{testDrives.length}</Text>
          <Text style={styles.statLabel}>Lịch lái thử</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{savedCars.length}</Text>
          <Text style={styles.statLabel}>Xe đã lưu</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>AutoMatch</Text>
          <Text style={styles.statLabel}>AI Assistant</Text>
        </View>
      </View>

      {/* Booked Test Drives Section */}
      <Text style={styles.sectionTitle}>🚗 Lịch Lái Thử Đã Đặt</Text>
      {testDrives.length === 0 ? (
        <Text style={styles.emptyText}>Chưa có lịch đăng ký lái thử nào.</Text>
      ) : (
        testDrives.map((item) => (
          <Card key={item.id} style={styles.bookingCard}>
            <View style={styles.bookingHeader}>
              <View style={styles.carBrief}>
                <Image
                  source={{ uri: item.car?.image_url || fallbackImage }}
                  style={styles.carThumb}
                />
                <View>
                  <Text style={styles.bookingCarName}>
                    {item.car ? `${item.car.make} ${item.car.model}` : 'Mẫu xe AutoMatch'}
                  </Text>
                  <Text style={styles.bookingDate}>
                    ⏰ {new Date(item.scheduled_date).toLocaleString()}
                  </Text>
                </View>
              </View>
              <Badge
                label={item.status === 'confirmed' ? 'Đã xác nhận' : item.status}
                variant={item.status === 'confirmed' ? 'success' : 'conflict'}
                size="sm"
              />
            </View>
            {item.notes && <Text style={styles.showroomText}>📝 {item.notes}</Text>}
          </Card>
        ))
      )}

      {/* Saved Cars Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🔖 Xe Đã Lưu Thích</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/ai-chat' as any)}>
          <Text style={styles.seeAllText}>Tìm thêm với AI</Text>
        </TouchableOpacity>
      </View>

      {savedCars.length === 0 ? (
        <Text style={styles.emptyText}>Chưa có xe nào trong danh sách yêu thích.</Text>
      ) : (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.savedScroll}
          data={savedCars}
          keyExtractor={(sc) => sc.id}
          renderItem={({ item: sc }) => (
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.savedCarCard}
              onPress={() => router.push(`/car/${sc.car_id}` as any)}
            >
              <Image source={{ uri: sc.car?.image_url || fallbackImage }} style={styles.savedCarImg} />
              <View style={styles.savedCarContent}>
                <Text style={styles.savedCarTitle} numberOfLines={1}>
                  {sc.car ? `${sc.car.make} ${sc.car.model}` : 'Xe ô tô'}
                </Text>
                <Text style={styles.savedCarPrice}>
                  {sc.car?.price ? `${((sc.car.price || 0) / 1_000_000).toFixed(0)} triệu VNĐ` : 'Liên hệ'}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Options & Settings */}
      <Text style={styles.sectionTitle}>⚙️ Cài Đặt & Hỗ Trợ</Text>
      <View style={styles.settingsList}>
        <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/orders' as any)}>
          <Ionicons name="receipt-outline" size={20} color={colors.primary} />
          <Text style={styles.settingText}>Đơn hàng của tôi & Thanh toán ZaloPay</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <Ionicons name="sparkles-outline" size={20} color={colors.primary} />
          <Text style={styles.settingText}>Cấu hình Trợ lý AI AutoMatch</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.text} />
          <Text style={styles.settingText}>Chính sách bảo mật & RLS Data</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>
        {user && (
          <TouchableOpacity style={styles.settingItem} onPress={signOut}>
            <Ionicons name="log-out-outline" size={20} color={colors.danger} />
            <Text style={[styles.settingText, { color: colors.danger }]}>Đăng xuất</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#000',
    fontSize: 20,
    fontWeight: '800',
  },
  profileInfo: {
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  userEmail: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 12,
  },
  seeAllText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  bookingCard: {
    marginBottom: 10,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  carBrief: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  carThumb: {
    width: 50,
    height: 36,
    borderRadius: 6,
  },
  bookingCarName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  bookingDate: {
    color: colors.primary,
    fontSize: 11,
    marginTop: 2,
  },
  showroomText: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  savedScroll: {
    marginBottom: 20,
  },
  savedCarCard: {
    width: 140,
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    marginRight: 10,
    overflow: 'hidden',
  },
  savedCarImg: {
    width: '100%',
    height: 80,
  },
  savedCarContent: {
    padding: 8,
  },
  savedCarTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  savedCarPrice: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  settingsList: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    marginBottom: 30,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  settingText: {
    color: colors.text,
    fontSize: 13,
    flex: 1,
  },
});
