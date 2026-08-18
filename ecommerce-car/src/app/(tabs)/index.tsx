import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography, shadows } from '../../theme';
import { useCarStore } from '../../store/useCarStore';
import { useCartStore } from '../../store/useCartStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useAuthStore } from '../../store/useAuthStore';
import { CarCard } from '../../components/car/CarCard';
import { PillFilter, PillOption } from '../../components/ui/PillFilter';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatVndPrice } from '../../components/ui/PriceTag';
import { CarResponse } from '../../types';
import { ASSET_IMAGES, FALLBACK_CAR_URL } from '../../constants/images';

const CATEGORY_OPTIONS: PillOption<string>[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'Coupe', label: 'Thể thao & Coupe' },
  { id: 'SUV', label: 'SUV Sang trọng' },
  { id: 'Sedan', label: 'Sedan Doanh nhân' },
  { id: 'Điện', label: 'Xe Điện EV' },
  { id: '7 chỗ', label: '7 Chỗ' },
];

export default function HomeScreen() {
  const { topCars, fetchTopCars, savedCars, toggleSaveCar, isLoading } = useCarStore();
  const { addToCart, getItemCount } = useCartStore();
  const { getUnreadCount, fetchNotifications } = useNotificationStore();
  const { user } = useAuthStore();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchTopCars();
    fetchNotifications();
  }, [fetchTopCars, fetchNotifications]);

  const cartCount = getItemCount();
  const unreadNotifs = getUnreadCount();

  const handleCarDetails = (carId: string) => {
    router.push(`/car/${carId}` as any);
  };

  const handleCarCompare = (car: CarResponse) => {
    router.push('/(tabs)/compare' as any);
  };

  const handleAddToCart = async (carId: string) => {
    try {
      await addToCart(user?.id, carId, 1);
      Alert.alert('Thành công', 'Đã thêm xe vào danh sách đặt cọc.', [
        { text: 'Tiếp tục xem', style: 'cancel' },
        { text: 'Xem giỏ hàng', onPress: () => router.push('/cart' as any) },
      ]);
    } catch {
      Alert.alert('Lỗi', 'Không thể thêm vào giỏ hàng.');
    }
  };

  const handleToggleSave = (carId: string) => {
    toggleSaveCar(carId, user?.id || 'guest');
  };

  const filteredCars = useMemo(() => {
    if (selectedCategory === 'all') return topCars;
    return topCars.filter(
      (c) =>
        c.metadata?.body_type?.includes(selectedCategory) ||
        c.metadata?.fuel_type?.includes(selectedCategory)
    );
  }, [topCars, selectedCategory]);

  const trendingCars = topCars.slice(0, 5);
  const electricAndLuxuryCars = topCars
    .filter(
      (c) =>
        c.metadata?.fuel_type?.includes('Điện') ||
        c.metadata?.fuel_type?.includes('Electric') ||
        (c.price || 0) >= 2000000000
    )
    .slice(0, 4);

  return (
    <View style={styles.screen}>
      {/* Top App Bar */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <Text style={styles.brandText}>AUTOMATCH</Text>
          <Badge label="AI" variant="primary" size="xs" />
        </View>

        <View style={styles.topActions}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.actionIconBtn}
            onPress={() => router.push('/notifications' as any)}
          >
            <Ionicons name="notifications-outline" size={18} color={colors.text} />
            {unreadNotifs > 0 && (
              <View style={styles.unreadDot}>
                <Text style={styles.unreadDotText}>{unreadNotifs}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.actionIconBtn}
            onPress={() => router.push('/cart' as any)}
          >
            <Ionicons name="bag-handle-outline" size={18} color={colors.text} />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
        {/* Search Trigger Bar */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.searchTrigger}
          onPress={() => router.push('/(tabs)/catalog' as any)}
        >
          <Ionicons name="search-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.searchPlaceholder}>Tìm kiếm Porsche, BMW, VinFast, SUV...</Text>
          <View style={styles.searchPill}>
            <Ionicons name="sparkles" size={11} color="#FFFFFF" />
            <Text style={styles.searchPillText}>AI Search</Text>
          </View>
        </TouchableOpacity>

        {/* Hero Featured Cars Banner Slider */}
        {trendingCars.length > 0 && (
          <FlatList
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            data={trendingCars}
            keyExtractor={(item) => item.id}
            style={styles.promoSlider}
            renderItem={({ item, index }) => {
              const heroSource =
                index === 0
                  ? ASSET_IMAGES.heroSport
                  : index === 1
                  ? ASSET_IMAGES.heroSuv
                  : index === 2
                  ? ASSET_IMAGES.heroSedan
                  : { uri: item.image_url || FALLBACK_CAR_URL };

              return (
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={styles.promoCard}
                  onPress={() => handleCarDetails(item.id)}
                >
                  <Image
                    source={heroSource}
                    style={styles.promoImage}
                    contentFit="cover"
                  />
                  <View style={styles.promoOverlay}>
                    <Badge
                      label={item.metadata?.fuel_type || 'Nổi bật'}
                      variant="gold"
                      size="xs"
                      style={{ marginBottom: 4 }}
                    />
                    <Text style={styles.promoTitle}>
                      {item.make} {item.model}
                    </Text>
                    <Text style={styles.promoSubtitle}>
                      Năm {item.year} • {item.engine_hp ? `${item.engine_hp} HP` : 'Hiệu năng cao'}
                    </Text>
                    <View style={styles.voucherPill}>
                      <Text style={styles.voucherLabel}>Giá từ: </Text>
                      <Text style={styles.voucherCode}>{formatVndPrice(item.price)}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}

        {/* Quick Service Action Shortcuts */}
        <View style={styles.quickServicesGrid}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.serviceBox}
            onPress={() => router.push('/(tabs)/ai-chat' as any)}
          >
            <View style={[styles.serviceIcon, { backgroundColor: colors.primaryMuted }]}>
              <Ionicons name="sparkles" size={17} color={colors.primaryHover} />
            </View>
            <Text style={styles.serviceLabel}>Tư Vấn AI</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.serviceBox}
            onPress={() => router.push('/(tabs)/catalog' as any)}
          >
            <View style={[styles.serviceIcon, { backgroundColor: colors.secondaryMuted }]}>
              <Ionicons name="grid-outline" size={17} color={colors.secondaryHover} />
            </View>
            <Text style={styles.serviceLabel}>Kho Xe</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.serviceBox}
            onPress={() => router.push('/(tabs)/compare' as any)}
          >
            <View style={[styles.serviceIcon, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
              <Ionicons name="git-compare-outline" size={17} color={colors.success} />
            </View>
            <Text style={styles.serviceLabel}>So Sánh</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.serviceBox}
            onPress={() => router.push('/orders' as any)}
          >
            <View style={[styles.serviceIcon, { backgroundColor: colors.conflictMuted }]}>
              <Ionicons name="receipt-outline" size={17} color={colors.conflict} />
            </View>
            <Text style={styles.serviceLabel}>Đơn Hàng</Text>
          </TouchableOpacity>
        </View>

        {/* Category Horizontal Filter Pills */}
        <SectionHeader
          title="Bộ sưu tập theo phân khúc"
          subtitle="Danh mục xe tuyển chọn tại Showroom"
          iconName="shapes-outline"
          actionText="Xem tất cả"
          onAction={() => router.push('/(tabs)/catalog' as any)}
        />
        <PillFilter
          options={CATEGORY_OPTIONS}
          selectedId={selectedCategory}
          onSelect={setSelectedCategory}
          style={{ marginBottom: spacing.sm }}
        />

        {/* Filtered Cars Horizontal Stream */}
        {isLoading ? (
          <ActivityIndicator color={colors.primary} size="small" style={{ marginVertical: 20 }} />
        ) : (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={filteredCars}
            keyExtractor={(car) => car.id}
            contentContainerStyle={styles.horizontalCarList}
            renderItem={({ item: car }) => {
              const isSaved = savedCars.some((sc) => sc.car_id === car.id);
              return (
                <CarCard
                  car={car}
                  layout="compact"
                  isSaved={isSaved}
                  onPressDetails={handleCarDetails}
                  onPressCompare={handleCarCompare}
                  onPressAddToCart={handleAddToCart}
                  onPressToggleSave={handleToggleSave}
                />
              );
            }}
          />
        )}

        {/* AI Assistant Banner Teaser */}
        <View style={styles.aiAdvisorBanner}>
          <View style={styles.aiAdvisorLeft}>
            <Badge label="AI Matchmaking" variant="secondary" size="xs" />
            <Text style={styles.aiAdvisorTitle}>Tư vấn xe phù hợp theo nhu cầu</Text>
            <Text style={styles.aiAdvisorDesc}>
              Trao đổi cùng AI để tìm dòng xe tối ưu ngân sách và thông số mong muốn.
            </Text>
            <Button
              title="Khám phá cùng AI"
              size="sm"
              variant="primary"
              onPress={() => router.push('/(tabs)/ai-chat' as any)}
              icon={<Ionicons name="sparkles" size={13} color="#FFFFFF" />}
              style={{ marginTop: spacing.xs + 2, alignSelf: 'flex-start' }}
            />
          </View>
        </View>

        {/* Trending Supercars & Top Sellers */}
        <SectionHeader
          title="Xe nổi bật tại Showroom"
          subtitle="Các mẫu xe được quan tâm nhiều nhất"
          iconName="flame-outline"
          actionText="Tất cả"
          onAction={() => router.push('/(tabs)/catalog' as any)}
        />

        <View style={styles.verticalCarList}>
          {trendingCars.map((car) => {
            const isSaved = savedCars.some((sc) => sc.car_id === car.id);
            return (
              <CarCard
                key={car.id}
                car={car}
                isSaved={isSaved}
                onPressDetails={handleCarDetails}
                onPressCompare={handleCarCompare}
                onPressAddToCart={handleAddToCart}
                onPressToggleSave={handleToggleSave}
              />
            );
          })}
        </View>

        {/* New EV & Luxury Highlights */}
        <SectionHeader
          title="Xe điện & Công nghệ mới"
          subtitle="Tầm vận hành dài, hỗ trợ lái an toàn ADAS"
          iconName="flash-outline"
          actionText="Khám phá"
          onAction={() => router.push('/(tabs)/catalog' as any)}
        />

        <View style={styles.verticalCarList}>
          {electricAndLuxuryCars.map((car) => {
            const isSaved = savedCars.some((sc) => sc.car_id === car.id);
            return (
              <CarCard
                key={car.id}
                car={car}
                isSaved={isSaved}
                onPressDetails={handleCarDetails}
                onPressCompare={handleCarCompare}
                onPressAddToCart={handleAddToCart}
                onPressToggleSave={handleToggleSave}
              />
            );
          })}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: 46,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandText: {
    color: colors.text,
    fontSize: typography.sizes.base + 1,
    fontWeight: typography.weights.bold,
    letterSpacing: 1,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  actionIconBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  unreadDotText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: typography.weights.bold,
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: typography.weights.bold,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  searchTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.sm,
    height: 42,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  searchPlaceholder: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs + 1,
    marginLeft: 6,
    flex: 1,
  },
  searchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
    gap: 4,
  },
  searchPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: typography.weights.bold,
  },
  promoSlider: {
    marginBottom: spacing.md,
  },
  promoCard: {
    width: 300,
    height: 150,
    borderRadius: radii.md,
    overflow: 'hidden',
    marginRight: spacing.md,
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.border,
  },
  promoImage: {
    width: '100%',
    height: '100%',
  },
  promoOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(9, 10, 12, 0.72)',
    padding: spacing.md,
    justifyContent: 'flex-end',
  },
  promoTitle: {
    color: colors.text,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
  promoSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes['2xs'],
    marginTop: 1,
    marginBottom: 4,
  },
  voucherPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.xs,
    alignSelf: 'flex-start',
  },
  voucherLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes['2xs'],
  },
  voucherCode: {
    color: colors.primaryHover,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  quickServicesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  serviceBox: {
    alignItems: 'center',
    width: '23%',
  },
  serviceIcon: {
    width: 42,
    height: 42,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  serviceLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes['2xs'],
    fontWeight: typography.weights.medium,
    textAlign: 'center',
  },
  horizontalCarList: {
    paddingRight: spacing.lg,
    paddingBottom: spacing.xs,
  },
  aiAdvisorBanner: {
    backgroundColor: colors.surfaceElevated,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    marginVertical: spacing.md,
    ...shadows.sm,
  },
  aiAdvisorLeft: {
    gap: 3,
  },
  aiAdvisorTitle: {
    color: colors.text,
    fontSize: typography.sizes.sm + 1,
    fontWeight: typography.weights.semibold,
    marginTop: 3,
  },
  aiAdvisorDesc: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    lineHeight: 16,
  },
  verticalCarList: {
    gap: spacing.xs,
  },
});

