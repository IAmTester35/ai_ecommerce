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
  { id: 'Coupe', label: 'Coupe / Sport' },
  { id: 'SUV', label: 'SUV' },
  { id: 'Sedan', label: 'Sedan' },
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
            <Ionicons name="notifications-outline" size={17} color={colors.text} />
            {unreadNotifs > 0 && (
              <View style={styles.unreadDot} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.actionIconBtn}
            onPress={() => router.push('/cart' as any)}
          >
            <Ionicons name="bag-handle-outline" size={17} color={colors.text} />
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
          <Ionicons name="search-outline" size={15} color={colors.textSecondary} />
          <Text style={styles.searchPlaceholder}>Tìm kiếm dòng xe, thương hiệu...</Text>
          <View style={styles.searchPill}>
            <Ionicons name="sparkles" size={10} color="#FFFFFF" />
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
                  activeOpacity={0.92}
                  style={styles.promoCard}
                  onPress={() => handleCarDetails(item.id)}
                >
                  <Image
                    source={heroSource}
                    style={styles.promoImage}
                    contentFit="cover"
                  />
                  <View style={styles.promoOverlay}>
                    <View style={styles.promoBadgeRow}>
                      <Badge
                        label={item.metadata?.fuel_type || 'Nổi bật'}
                        variant="gold"
                        size="xs"
                      />
                    </View>
                    <Text style={styles.promoTitle}>
                      {item.make} {item.model}
                    </Text>
                    <View style={styles.promoBottomRow}>
                      <Text style={styles.promoSubtitle}>
                        Năm {item.year} {item.engine_hp ? `• ${item.engine_hp} HP` : ''}
                      </Text>
                      <Text style={styles.promoPrice}>{formatVndPrice(item.price)}</Text>
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
              <Ionicons name="sparkles" size={16} color={colors.primaryHover} />
            </View>
            <Text style={styles.serviceLabel}>Tư Vấn AI</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.serviceBox}
            onPress={() => router.push('/(tabs)/catalog' as any)}
          >
            <View style={[styles.serviceIcon, { backgroundColor: colors.secondaryMuted }]}>
              <Ionicons name="grid-outline" size={16} color={colors.secondaryHover} />
            </View>
            <Text style={styles.serviceLabel}>Kho Xe</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.serviceBox}
            onPress={() => router.push('/(tabs)/compare' as any)}
          >
            <View style={[styles.serviceIcon, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
              <Ionicons name="git-compare-outline" size={16} color={colors.success} />
            </View>
            <Text style={styles.serviceLabel}>So Sánh</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.serviceBox}
            onPress={() => router.push('/orders' as any)}
          >
            <View style={[styles.serviceIcon, { backgroundColor: colors.conflictMuted }]}>
              <Ionicons name="receipt-outline" size={16} color={colors.conflict} />
            </View>
            <Text style={styles.serviceLabel}>Đơn Hàng</Text>
          </TouchableOpacity>
        </View>

        {/* Category Horizontal Filter Pills */}
        <SectionHeader
          title="Bộ sưu tập"
          iconName="shapes-outline"
          actionText="Xem tất cả"
          onAction={() => router.push('/(tabs)/catalog' as any)}
        />
        <PillFilter
          options={CATEGORY_OPTIONS}
          selectedId={selectedCategory}
          onSelect={setSelectedCategory}
          style={{ marginBottom: spacing.xs }}
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Badge label="AI Matchmaking" variant="secondary" size="xs" />
            </View>
            <Text style={styles.aiAdvisorTitle}>Tư vấn xe thông minh</Text>
            <Text style={styles.aiAdvisorDesc}>
              Đối chiếu thông số kỹ thuật và ngân sách tối ưu tức thì cùng AI.
            </Text>
            <Button
              title="Khám phá ngay"
              size="sm"
              variant="primary"
              onPress={() => router.push('/(tabs)/ai-chat' as any)}
              icon={<Ionicons name="sparkles" size={12} color="#FFFFFF" />}
              style={{ marginTop: spacing.xs, alignSelf: 'flex-start' }}
            />
          </View>
        </View>

        {/* Trending Supercars & Top Sellers */}
        <SectionHeader
          title="Mẫu xe nổi bật"
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

        <View style={{ height: 24 }} />
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
    paddingTop: 48,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandText: {
    color: colors.text,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    letterSpacing: 1,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionIconBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  unreadDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.danger,
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
    paddingHorizontal: 2,
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
    borderRadius: radii.md,
    height: 42,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  searchPlaceholder: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    marginLeft: 8,
    flex: 1,
  },
  searchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.full,
    gap: 3,
  },
  searchPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: typography.weights.semibold,
  },
  promoSlider: {
    marginBottom: spacing.lg,
  },
  promoCard: {
    width: 290,
    height: 145,
    borderRadius: radii.md,
    overflow: 'hidden',
    marginRight: spacing.md,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  promoImage: {
    width: '100%',
    height: '100%',
  },
  promoOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(11, 13, 17, 0.65)',
    padding: spacing.md,
    justifyContent: 'flex-end',
  },
  promoBadgeRow: {
    marginBottom: 4,
  },
  promoTitle: {
    color: colors.text,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    lineHeight: 20,
  },
  promoBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  promoSubtitle: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  promoPrice: {
    color: colors.primaryHover,
    fontSize: 12,
    fontWeight: typography.weights.bold,
  },
  quickServicesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  serviceBox: {
    alignItems: 'center',
    width: '23%',
  },
  serviceIcon: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  serviceLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: typography.weights.medium,
    textAlign: 'center',
  },
  horizontalCarList: {
    paddingRight: spacing.lg,
    paddingVertical: 4,
  },
  aiAdvisorBanner: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    padding: spacing.md,
    marginVertical: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.20)',
  },
  aiAdvisorLeft: {
    gap: 3,
  },
  aiAdvisorTitle: {
    color: colors.text,
    fontSize: typography.sizes.sm + 0.5,
    fontWeight: typography.weights.semibold,
    lineHeight: 20,
    marginTop: 4,
  },
  aiAdvisorDesc: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
  verticalCarList: {
    gap: spacing.xs,
  },
});

