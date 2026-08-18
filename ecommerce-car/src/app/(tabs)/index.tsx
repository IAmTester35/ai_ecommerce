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

const CATEGORY_OPTIONS: PillOption<string>[] = [
  { id: 'all', label: 'Tất Cả' },
  { id: 'Coupe', label: 'Siêu Xe & Sport' },
  { id: 'SUV', label: 'SUV Sang Trọng' },
  { id: 'Sedan', label: 'Sedan Doanh Nhân' },
  { id: 'Điện', label: 'Xe Điện Tương Lai' },
  { id: '7 chỗ', label: 'Gia Đình 7 Chỗ' },
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
      Alert.alert('Thành Công! 🛒', 'Đã thêm xe vào giỏ hàng đặt cọc.', [
        { text: 'Tiếp tục xem', style: 'cancel' },
        { text: 'Đến giỏ hàng', onPress: () => router.push('/cart' as any) },
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

  const fallbackHeroImage =
    'https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=1000';

  return (
    <View style={styles.screen}>
      {/* Top Fixed App Bar */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <Text style={styles.brandText}>AutoMatch</Text>
          <Badge label="AI RAG" variant="primary" size="xs" />
        </View>

        <View style={styles.topActions}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.actionIconBtn}
            onPress={() => router.push('/notifications' as any)}
          >
            <Ionicons name="notifications-outline" size={22} color={colors.text} />
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
            <Ionicons name="cart-outline" size={22} color={colors.text} />
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
          <Ionicons name="search-outline" size={18} color={colors.primary} />
          <Text style={styles.searchPlaceholder}>Tìm kiếm Porsche, BMW, VinFast, SUV...</Text>
          <View style={styles.searchPill}>
            <Ionicons name="sparkles" size={12} color={colors.textDark} />
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
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.promoCard}
                onPress={() => handleCarDetails(item.id)}
              >
                <Image
                  source={{ uri: item.image_url || fallbackHeroImage }}
                  style={styles.promoImage}
                  contentFit="cover"
                />
                <View style={styles.promoOverlay}>
                  <Badge
                    label={item.metadata?.fuel_type || 'Xe Nổi Bật'}
                    variant="gold"
                    size="xs"
                    style={{ marginBottom: 6 }}
                  />
                  <Text style={styles.promoTitle}>
                    {item.make} {item.model}
                  </Text>
                  <Text style={styles.promoSubtitle}>
                    Năm {item.year} • {item.engine_hp ? `${item.engine_hp} HP` : 'Hiệu năng cao'}
                  </Text>
                  <View style={styles.voucherPill}>
                    <Text style={styles.voucherLabel}>Giá niêm yết: </Text>
                    <Text style={styles.voucherCode}>{formatVndPrice(item.price)}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
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
              <Ionicons name="sparkles" size={20} color={colors.primary} />
            </View>
            <Text style={styles.serviceLabel}>Tư Vấn AI</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.serviceBox}
            onPress={() => router.push('/(tabs)/catalog' as any)}
          >
            <View style={[styles.serviceIcon, { backgroundColor: colors.secondaryMuted }]}>
              <Ionicons name="car-sport" size={20} color={colors.secondary} />
            </View>
            <Text style={styles.serviceLabel}>Kho Xe Ô Tô</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.serviceBox}
            onPress={() => router.push('/(tabs)/compare' as any)}
          >
            <View style={[styles.serviceIcon, { backgroundColor: 'rgba(0, 230, 118, 0.15)' }]}>
              <Ionicons name="git-compare" size={20} color={colors.success} />
            </View>
            <Text style={styles.serviceLabel}>So Sánh Xe</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.serviceBox}
            onPress={() => router.push('/orders' as any)}
          >
            <View style={[styles.serviceIcon, { backgroundColor: colors.conflictMuted }]}>
              <Ionicons name="receipt" size={20} color={colors.conflict} />
            </View>
            <Text style={styles.serviceLabel}>Đơn Hàng</Text>
          </TouchableOpacity>
        </View>

        {/* Category Horizontal Filter Pills */}
        <SectionHeader
          title="🚗 Bộ Sưu Tập Xe Theo Phân Khúc"
          subtitle="Khám phá các dòng xe hàng đầu từ cơ sở dữ liệu Supabase"
          actionText="Xem tất cả"
          onAction={() => router.push('/(tabs)/catalog' as any)}
        />
        <PillFilter
          options={CATEGORY_OPTIONS}
          selectedId={selectedCategory}
          onSelect={setSelectedCategory}
          style={{ marginBottom: spacing.md }}
        />

        {/* Filtered Cars Horizontal Stream */}
        {isLoading ? (
          <ActivityIndicator color={colors.primary} size="large" style={{ marginVertical: 24 }} />
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
                  car={{
                    ...car,
                    engine_hp: car.engine_hp || undefined,
                    price: car.price || undefined,
                    image_url: car.image_url || undefined,
                    metadata: car.metadata || undefined,
                    similarity: 0.94,
                    rerank_score: 0.95,
                  }}
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
            <Badge label="Conflict-Aware RAG" variant="secondary" size="xs" />
            <Text style={styles.aiAdvisorTitle}>Bạn Chưa Biết Nên Chọn Xe Nào?</Text>
            <Text style={styles.aiAdvisorDesc}>
              Hỏi Trợ lý AI: &quot;Tôi cần xe SUV 7 chỗ cách âm tốt, tài chính 2 tỷ&quot;
            </Text>
            <Button
              title="Chat Tư Vấn Với AI Ngay"
              size="sm"
              variant="primary"
              onPress={() => router.push('/(tabs)/ai-chat' as any)}
              icon={<Ionicons name="sparkles" size={14} color={colors.textDark} />}
              style={{ marginTop: spacing.sm, alignSelf: 'flex-start' }}
            />
          </View>
        </View>

        {/* Trending Supercars & Top Sellers */}
        <SectionHeader
          title="🔥 Top Xe Nổi Bật Tại Showroom"
          subtitle="Những mẫu xe thể thao & SUV hot nhất trên hệ thống"
          actionText="Tất cả"
          onAction={() => router.push('/(tabs)/catalog' as any)}
        />

        <View style={styles.verticalCarList}>
          {trendingCars.map((car) => {
            const isSaved = savedCars.some((sc) => sc.car_id === car.id);
            return (
              <CarCard
                key={car.id}
                car={{
                  ...car,
                  engine_hp: car.engine_hp || undefined,
                  price: car.price || undefined,
                  image_url: car.image_url || undefined,
                  metadata: car.metadata || undefined,
                  similarity: 0.92,
                  rerank_score: 0.94,
                }}
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
          title="⚡ Kỷ Nguyên Xe Điện & Luxury Flagship"
          subtitle="Tầm vận hành xa, công nghệ ADAS tự lái thông minh"
          actionText="Khám phá"
          onAction={() => router.push('/(tabs)/catalog' as any)}
        />

        <View style={styles.verticalCarList}>
          {electricAndLuxuryCars.map((car) => {
            const isSaved = savedCars.some((sc) => sc.car_id === car.id);
            return (
              <CarCard
                key={car.id}
                car={{
                  ...car,
                  engine_hp: car.engine_hp || undefined,
                  price: car.price || undefined,
                  image_url: car.image_url || undefined,
                  metadata: car.metadata || undefined,
                  similarity: 0.91,
                  rerank_score: 0.93,
                }}
                isSaved={isSaved}
                onPressDetails={handleCarDetails}
                onPressCompare={handleCarCompare}
                onPressAddToCart={handleAddToCart}
                onPressToggleSave={handleToggleSave}
              />
            );
          })}
        </View>

        <View style={{ height: 40 }} />
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
    borderBottomColor: colors.border,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  brandText: {
    color: colors.text,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.extrabold,
    letterSpacing: 0.5,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionIconBtn: {
    width: 40,
    height: 40,
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
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  unreadDotText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: typography.weights.bold,
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: colors.textDark,
    fontSize: 9,
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
    borderRadius: radii.md,
    height: 48,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  searchPlaceholder: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    marginLeft: spacing.sm,
    flex: 1,
  },
  searchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.full,
    gap: 4,
  },
  searchPillText: {
    color: colors.textDark,
    fontSize: typography.sizes['2xs'],
    fontWeight: typography.weights.bold,
  },
  promoSlider: {
    marginBottom: spacing.lg,
  },
  promoCard: {
    width: 320,
    height: 160,
    borderRadius: radii.lg,
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
    backgroundColor: 'rgba(11, 14, 20, 0.72)',
    padding: spacing.md,
    justifyContent: 'flex-end',
  },
  promoTitle: {
    color: colors.text,
    fontSize: typography.sizes.base + 1,
    fontWeight: typography.weights.bold,
  },
  promoSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    marginTop: 2,
    marginBottom: 6,
  },
  voucherPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.xs,
    alignSelf: 'flex-start',
  },
  voucherLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes['2xs'],
  },
  voucherCode: {
    color: colors.primary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.extrabold,
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
    width: 48,
    height: 48,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  serviceLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes['2xs'] + 1,
    fontWeight: typography.weights.semibold,
    textAlign: 'center',
  },
  horizontalCarList: {
    paddingRight: spacing.lg,
    paddingBottom: spacing.sm,
  },
  aiAdvisorBanner: {
    backgroundColor: colors.surfaceElevated,
    borderColor: 'rgba(124, 77, 255, 0.35)',
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginVertical: spacing.lg,
    ...shadows.glowPurple,
  },
  aiAdvisorLeft: {
    gap: 4,
  },
  aiAdvisorTitle: {
    color: colors.text,
    fontSize: typography.sizes.base + 1,
    fontWeight: typography.weights.bold,
    marginTop: 4,
  },
  aiAdvisorDesc: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    lineHeight: 18,
  },
  verticalCarList: {
    gap: spacing.sm,
  },
});
