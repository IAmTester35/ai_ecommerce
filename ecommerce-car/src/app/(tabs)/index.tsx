import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  ScrollView,
  RefreshControl,
  ViewStyle,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, spacing, typography } from '../../theme';
import { useCarStore } from '../../store/useCarStore';
import { useCartStore } from '../../store/useCartStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useAuthStore } from '../../store/useAuthStore';
import { globalAlert } from '../../store/useDialogStore';
import { useResponsive } from '../../hooks/useResponsive';
import { ResponsiveContainer } from '../../components/ui/ResponsiveContainer';
import { CarCard } from '../../components/car/CarCard';
import { PillFilter, PillOption } from '../../components/ui/PillFilter';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatVndPrice } from '../../components/ui/PriceTag';
import { CarResponse } from '../../types';
import { ASSET_IMAGES, FALLBACK_CAR_URL } from '../../constants/images';

const CATEGORY_OPTIONS: PillOption<string>[] = [
  { id: 'all', label: 'Tất cả phân khúc' },
  { id: 'Coupe', label: 'Coupe / Sport' },
  { id: 'SUV', label: 'SUV Gầm Cao' },
  { id: 'Sedan', label: 'Sedan Hạng Sang' },
  { id: 'Điện', label: 'Thuần Điện EV' },
  { id: '7 chỗ', label: '7 Chỗ Gia Đình' },
];

const LUXURY_BRANDS = [
  { id: 'all', name: 'Tất cả' },
  { id: 'Porsche', name: 'Porsche' },
  { id: 'Mercedes-Benz', name: 'Mercedes' },
  { id: 'BMW', name: 'BMW' },
  { id: 'Tesla', name: 'Tesla' },
  { id: 'Lexus', name: 'Lexus' },
  { id: 'Audi', name: 'Audi' },
  { id: 'VinFast', name: 'VinFast' },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { topCars, fetchTopCars, savedCars, toggleSaveCar, isLoading } = useCarStore();
  const { addToCart, getItemCount } = useCartStore();
  const { getUnreadCount, fetchNotifications } = useNotificationStore();
  const { user } = useAuthStore();
  const { isMobile, isDesktop, select } = useResponsive();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [activeHeroIndex, setActiveHeroIndex] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  useEffect(() => {
    fetchTopCars();
    fetchNotifications();
  }, [fetchTopCars, fetchNotifications]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([fetchTopCars(), fetchNotifications()]);
    } catch {
      // silent catch for pull-to-refresh
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchTopCars, fetchNotifications]);

  const cartCount = getItemCount();
  const unreadNotifs = getUnreadCount();

  const handleCarDetails = (carId: string) => {
    router.push(`/car/${carId}` as any);
  };

  const handleCarCompare = (car: CarResponse) => {
    router.push({
      pathname: '/(tabs)/compare',
      params: { ids: car.id },
    } as any);
  };

  const handleAddToCart = async (carId: string) => {
    if (!user) {
      globalAlert('Yêu cầu đăng nhập', 'Vui lòng đăng nhập để thêm xe vào danh sách đặt cọc.', [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đăng nhập', onPress: () => router.push('/(auth)/login' as any) },
      ]);
      return;
    }
    try {
      await addToCart(user.id, carId, 1);
      globalAlert('Thành công', 'Đã thêm xe vào danh sách đặt cọc.', [
        { text: 'Tiếp tục xem', style: 'cancel' },
        { text: 'Xem giỏ hàng', onPress: () => router.push('/cart' as any) },
      ]);
    } catch (err: any) {
      globalAlert('Lỗi', err.message || 'Không thể thêm vào giỏ hàng.');
    }
  };

  const handleToggleSave = (carId: string) => {
    toggleSaveCar(carId, user?.id || 'guest');
  };

  const filteredCars = useMemo(() => {
    return topCars.filter((c) => {
      const matchCat =
        selectedCategory === 'all' ||
        c.metadata?.body_type?.includes(selectedCategory) ||
        c.metadata?.fuel_type?.includes(selectedCategory);

      const matchBrand =
        selectedBrand === 'all' ||
        c.make.toLowerCase() === selectedBrand.toLowerCase();

      return matchCat && matchBrand;
    });
  }, [topCars, selectedCategory, selectedBrand]);

  const trendingCars = topCars.slice(0, 5);
  const electricAndLuxuryCars = topCars
    .filter(
      (c) =>
        c.metadata?.fuel_type?.includes('Điện') ||
        c.metadata?.fuel_type?.includes('Electric') ||
        (c.price || 0) >= 2000000000
    )
    .slice(0, 4);

  const cardWidthStyle = select<ViewStyle>({
    mobile: { width: '100%' },
    tablet: { width: '48.5%' },
    desktop: { width: '23.8%' },
  });

  const handleHeroScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const cardWidth = isMobile ? SCREEN_WIDTH - 32 : 400;
    const index = Math.round(offsetX / (cardWidth + 12));
    if (index >= 0 && index < trendingCars.length) {
      setActiveHeroIndex(index);
    }
  };

  return (
    <View style={styles.screen}>
      {/* Native App Top Bar */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 44) }]}>
        <View style={styles.topBarInner}>
          <View style={styles.brandContainer}>
            <View style={styles.brandRow}>
              <Text style={styles.brandText}>AUTOMATCH</Text>
              <View style={styles.aiBadgePill}>
                <Ionicons name="sparkles" size={9} color="#FFFFFF" />
                <Text style={styles.aiBadgeText}>AI</Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.locationChip}
              onPress={() => router.push('/(tabs)/catalog' as any)}
            >
              <Ionicons name="location" size={10} color={colors.primaryHover} />
              <Text style={styles.locationText}>Showroom TP. Hồ Chí Minh</Text>
              <Ionicons name="chevron-down" size={10} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.topActions}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.actionIconBtn}
              onPress={() => router.push('/(tabs)/catalog' as any)}
              accessibilityLabel="Tìm kiếm"
            >
              <Ionicons name="search-outline" size={18} color={colors.text} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.actionIconBtn}
              onPress={() => router.push('/notifications' as any)}
              accessibilityLabel="Thông báo"
            >
              <Ionicons name="notifications-outline" size={18} color={colors.text} />
              {unreadNotifs > 0 && <View style={styles.unreadDot} />}
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.actionIconBtn}
              onPress={() => router.push('/cart' as any)}
              accessibilityLabel="Giỏ hàng"
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
      </View>

      <ResponsiveContainer
        scrollable
        maxWidth="xl"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primaryHover}
            colors={[colors.primaryHover]}
          />
        }
      >
        {/* Native Mobile Search Pill */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.searchTrigger}
          onPress={() => router.push('/(tabs)/catalog' as any)}
        >
          <Ionicons name="search-outline" size={16} color={colors.primaryHover} />
          <Text style={styles.searchPlaceholder}>Tìm xe, thương hiệu, thông số (vd: Porsche 911)...</Text>
          <View style={styles.searchPill}>
            <Ionicons name="sparkles" size={11} color="#FFFFFF" />
            <Text style={styles.searchPillText}>AI Search</Text>
          </View>
        </TouchableOpacity>

        {/* Quick Automotive Brand Selector Carousel */}
        <View style={styles.brandSelectorSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.brandScrollContent}
          >
            {LUXURY_BRANDS.map((b) => {
              const isActive = selectedBrand === b.id;
              return (
                <TouchableOpacity
                  key={b.id}
                  activeOpacity={0.75}
                  onPress={() => setSelectedBrand(b.id)}
                  style={[styles.brandChip, isActive && styles.brandChipActive]}
                >
                  <Text style={[styles.brandChipText, isActive && styles.brandChipTextActive]}>
                    {b.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Hero Featured Cars Banner Slider with Dots */}
        {trendingCars.length > 0 && (
          <View style={styles.heroWrapper}>
            <FlatList
              horizontal
              pagingEnabled={isMobile}
              showsHorizontalScrollIndicator={false}
              data={trendingCars}
              keyExtractor={(item) => item.id}
              onScroll={handleHeroScroll}
              scrollEventThrottle={16}
              contentContainerStyle={styles.heroScrollContent}
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
                    style={[styles.promoCard, isDesktop && styles.promoCardDesktop]}
                    onPress={() => handleCarDetails(item.id)}
                  >
                    <Image source={heroSource} style={styles.promoImage} contentFit="cover" />
                    <View style={styles.promoGradient} />
                    <View style={styles.promoOverlay}>
                      <View style={styles.promoBadgeRow}>
                        <View style={styles.heroLuxuryBadge}>
                          <Ionicons name="sparkles" size={10} color="#FFFFFF" />
                          <Text style={styles.heroLuxuryBadgeText}>
                            {item.metadata?.fuel_type || 'Mẫu xe tâm điểm'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.promoTitle}>
                        {item.make} {item.model}
                      </Text>
                      <View style={styles.promoBottomRow}>
                        <View>
                          <Text style={styles.promoSubtitle}>
                            Năm {item.year} {item.engine_hp ? `• ${item.engine_hp} HP` : ''}
                          </Text>
                          <Text style={styles.promoPrice}>
                            {formatVndPrice(item.price, undefined, {
                              engineHp: item.engine_hp,
                              fuelType: item.metadata?.engine_fuel_type || item.metadata?.fuel_type,
                            })}
                          </Text>
                        </View>
                        <View style={styles.heroActionBtn}>
                          <Text style={styles.heroActionBtnText}>Xem ngay</Text>
                          <Ionicons name="arrow-forward" size={12} color="#FFFFFF" />
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />

            {/* Pagination Dots */}
            {trendingCars.length > 1 && (
              <View style={styles.paginationDotsRow}>
                {trendingCars.map((_, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.dot,
                      activeHeroIndex === idx && styles.dotActive,
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Native Mobile Quick Services Hub (Ergonomic Squircle Tiles) */}
        <View style={styles.quickServicesGrid}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.serviceBox}
            onPress={() => router.push('/(tabs)/ai-chat' as any)}
          >
            <View style={[styles.serviceIcon, { backgroundColor: colors.primaryMuted }]}>
              <Ionicons name="sparkles" size={20} color={colors.primaryHover} />
            </View>
            <Text style={styles.serviceLabel}>Tư Vấn AI</Text>
            <Text style={styles.serviceSubLabel}>Đối chiếu ngân sách</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.serviceBox}
            onPress={() => router.push('/(tabs)/catalog' as any)}
          >
            <View style={[styles.serviceIcon, { backgroundColor: colors.secondaryMuted }]}>
              <Ionicons name="car-sport" size={20} color={colors.secondaryHover} />
            </View>
            <Text style={styles.serviceLabel}>Kho Xe</Text>
            <Text style={styles.serviceSubLabel}>Khám phá 50+ xe</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.serviceBox}
            onPress={() => router.push('/(tabs)/compare' as any)}
          >
            <View style={[styles.serviceIcon, { backgroundColor: 'rgba(16, 185, 129, 0.14)' }]}>
              <Ionicons name="git-compare" size={20} color={colors.success} />
            </View>
            <Text style={styles.serviceLabel}>So Sánh</Text>
            <Text style={styles.serviceSubLabel}>Chi tiết thông số</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.serviceBox}
            onPress={() => router.push('/orders' as any)}
          >
            <View style={[styles.serviceIcon, { backgroundColor: colors.conflictMuted }]}>
              <Ionicons name="receipt" size={20} color={colors.conflict} />
            </View>
            <Text style={styles.serviceLabel}>Đơn Cọc</Text>
            <Text style={styles.serviceSubLabel}>Hợp đồng của tôi</Text>
          </TouchableOpacity>
        </View>

        {/* Category Horizontal Filter Pills */}
        <SectionHeader
          title="Bộ sưu tập theo dòng"
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
          <ActivityIndicator color={colors.primaryHover} size="small" style={{ marginVertical: 24 }} />
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
              <Badge label="AI Matchmaking 2.0" variant="secondary" size="xs" dot />
            </View>
            <Text style={styles.aiAdvisorTitle}>Trợ lý tư vấn xe độc quyền</Text>
            <Text style={styles.aiAdvisorDesc}>
              Bóc tách nhu cầu tài chính, phong cách và thông số kỹ thuật xe chỉ trong vài giây.
            </Text>
            <Button
              title="Khám phá cùng AI"
              size="sm"
              variant="primary"
              onPress={() => router.push('/(tabs)/ai-chat' as any)}
              icon={<Ionicons name="sparkles" size={13} color="#FFFFFF" />}
              style={{ marginTop: spacing.xs, alignSelf: 'flex-start' }}
            />
          </View>
        </View>

        {/* Trending Supercars & Top Sellers (Adaptive Grid) */}
        <SectionHeader
          title="Mẫu xe tâm điểm"
          iconName="flame-outline"
          actionText="Tất cả"
          onAction={() => router.push('/(tabs)/catalog' as any)}
        />

        <View style={[styles.carGrid, !isMobile && styles.carGridDesktop]}>
          {trendingCars.map((car) => {
            const isSaved = savedCars.some((sc) => sc.car_id === car.id);
            return (
              <View key={car.id} style={cardWidthStyle}>
                <CarCard
                  car={car}
                  isSaved={isSaved}
                  onPressDetails={handleCarDetails}
                  onPressCompare={handleCarCompare}
                  onPressAddToCart={handleAddToCart}
                  onPressToggleSave={handleToggleSave}
                />
              </View>
            );
          })}
        </View>

        {/* New EV & Luxury Highlights (Adaptive Grid) */}
        <SectionHeader
          title="Xe điện & Công nghệ tương lai"
          iconName="flash-outline"
          actionText="Khám phá"
          onAction={() => router.push('/(tabs)/catalog' as any)}
        />

        <View style={[styles.carGrid, !isMobile && styles.carGridDesktop]}>
          {electricAndLuxuryCars.map((car) => {
            const isSaved = savedCars.some((sc) => sc.car_id === car.id);
            return (
              <View key={car.id} style={cardWidthStyle}>
                <CarCard
                  car={car}
                  isSaved={isSaved}
                  onPressDetails={handleCarDetails}
                  onPressCompare={handleCarCompare}
                  onPressAddToCart={handleAddToCart}
                  onPressToggleSave={handleToggleSave}
                />
              </View>
            );
          })}
        </View>

        <View style={{ height: 32 }} />
      </ResponsiveContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  topBarInner: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm + 2,
  },
  brandContainer: {
    flex: 1,
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
    letterSpacing: 1.2,
  },
  aiBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: radii.full,
    gap: 2,
  },
  aiBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: typography.weights.bold,
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  locationText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: typography.weights.medium,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  unreadDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.danger,
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: typography.weights.bold,
  },
  searchTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.lg,
    height: 44,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  searchPlaceholder: {
    color: colors.textMuted,
    fontSize: 12.5,
    marginLeft: 8,
    flex: 1,
  },
  searchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: radii.full,
    gap: 4,
  },
  searchPillText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: typography.weights.semibold,
  },
  brandSelectorSection: {
    marginVertical: spacing.xs + 2,
  },
  brandScrollContent: {
    paddingVertical: spacing.xs,
    gap: 8,
  },
  brandChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  brandChipActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.18)',
    borderColor: colors.primaryHover,
  },
  brandChipText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: typography.weights.medium,
  },
  brandChipTextActive: {
    color: '#FFFFFF',
    fontWeight: typography.weights.semibold,
  },
  heroWrapper: {
    marginVertical: spacing.xs,
  },
  heroScrollContent: {
    paddingVertical: spacing.xs,
    gap: 12,
  },
  promoCard: {
    width: SCREEN_WIDTH > 440 ? 380 : SCREEN_WIDTH - 32,
    height: 195,
    borderRadius: radii.xl,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  promoCardDesktop: {
    width: 440,
    height: 220,
  },
  promoImage: {
    width: '100%',
    height: '100%',
  },
  promoGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '75%',
    backgroundColor: 'rgba(11, 13, 17, 0.72)',
  },
  promoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    justifyContent: 'flex-end',
  },
  promoBadgeRow: {
    marginBottom: 4,
  },
  heroLuxuryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(59, 130, 246, 0.85)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: radii.xs,
    gap: 3,
  },
  heroLuxuryBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: typography.weights.semibold,
  },
  promoTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: typography.weights.bold,
    lineHeight: 22,
  },
  promoBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 3,
  },
  promoSubtitle: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  promoPrice: {
    color: colors.primaryHover,
    fontSize: 14,
    fontWeight: typography.weights.bold,
    marginTop: 1,
  },
  heroActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.full,
    gap: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  heroActionBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: typography.weights.semibold,
  },
  paginationDotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dotActive: {
    width: 18,
    borderRadius: 3,
    backgroundColor: colors.primaryHover,
  },
  quickServicesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  serviceBox: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.lg,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  serviceIcon: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  serviceLabel: {
    color: colors.text,
    fontSize: 11.5,
    fontWeight: typography.weights.semibold,
  },
  serviceSubLabel: {
    color: colors.textMuted,
    fontSize: 9,
    marginTop: 2,
    textAlign: 'center',
  },
  horizontalCarList: {
    paddingVertical: spacing.xs,
    paddingBottom: spacing.sm,
  },
  aiAdvisorBanner: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginVertical: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
  },
  aiAdvisorLeft: {
    flex: 1,
  },
  aiAdvisorTitle: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    marginTop: 6,
  },
  aiAdvisorDesc: {
    color: colors.textSecondary,
    fontSize: 11.5,
    lineHeight: 17,
    marginTop: 4,
    marginBottom: 8,
  },
  carGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  carGridDesktop: {
    gap: spacing.md,
  },
});
