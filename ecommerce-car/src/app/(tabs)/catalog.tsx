import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '../../theme';
import { useCarStore } from '../../store/useCarStore';
import { useCartStore } from '../../store/useCartStore';
import { useAuthStore } from '../../store/useAuthStore';
import { globalAlert } from '../../store/useDialogStore';
import { useResponsive } from '../../hooks/useResponsive';
import { CarCard, CarCardLayout } from '../../components/car/CarCard';
import { CarFilterModal } from '../../components/car/CarFilterModal';
import { SearchBar } from '../../components/ui/SearchBar';
import { EmptyState } from '../../components/ui/EmptyState';
import { CarFilterParams, CarResponse } from '../../types';

export default function CatalogScreen() {
  const { filteredCars, filters, setFilters, applyFilters, resetFilters, savedCars, toggleSaveCar, isLoading } =
    useCarStore();
  const { addToCart } = useCartStore();
  const { user } = useAuthStore();
  const { isMobile, select } = useResponsive();

  const [searchQuery, setSearchQuery] = useState('');
  const [layoutMode, setLayoutMode] = useState<CarCardLayout>('grid');
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

  const numColumns = layoutMode === 'grid' ? select({ mobile: 1, tablet: 2, desktop: 3, wide: 4 }) : 1;

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    setFilters({ query: text });
    applyFilters();
  };

  const handleApplyModalFilters = (newFilters: CarFilterParams) => {
    setFilters(newFilters);
    applyFilters();
  };

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

  // Count active non-default filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.make && filters.make !== 'all') count++;
    if (filters.bodyType && filters.bodyType !== 'all') count++;
    if (filters.fuelType && filters.fuelType !== 'all') count++;
    if (filters.minPrice || filters.maxPrice) count++;
    if (filters.sortBy && filters.sortBy !== 'recommended') count++;
    return count;
  }, [filters]);

  const renderActiveFilterTags = () => {
    if (activeFilterCount === 0) return null;

    return (
      <View style={styles.activeFiltersRow}>
        {filters.make && filters.make !== 'all' && (
          <TouchableOpacity
            style={styles.filterTag}
            onPress={() => {
              setFilters({ make: undefined });
              applyFilters();
            }}
          >
            <Text style={styles.filterTagText}>Hãng: {filters.make}</Text>
            <Ionicons name="close" size={10} color={colors.primaryHover} />
          </TouchableOpacity>
        )}
        {filters.bodyType && filters.bodyType !== 'all' && (
          <TouchableOpacity
            style={styles.filterTag}
            onPress={() => {
              setFilters({ bodyType: undefined });
              applyFilters();
            }}
          >
            <Text style={styles.filterTagText}>Kiểu dáng: {filters.bodyType}</Text>
            <Ionicons name="close" size={10} color={colors.primaryHover} />
          </TouchableOpacity>
        )}
        {filters.fuelType && filters.fuelType !== 'all' && (
          <TouchableOpacity
            style={styles.filterTag}
            onPress={() => {
              setFilters({ fuelType: undefined });
              applyFilters();
            }}
          >
            <Text style={styles.filterTagText}>Nhiên liệu: {filters.fuelType}</Text>
            <Ionicons name="close" size={10} color={colors.primaryHover} />
          </TouchableOpacity>
        )}
        {(filters.minPrice || filters.maxPrice) && (
          <TouchableOpacity
            style={styles.filterTag}
            onPress={() => {
              setFilters({ minPrice: undefined, maxPrice: undefined });
              applyFilters();
            }}
          >
            <Text style={styles.filterTagText}>Khoảng giá</Text>
            <Ionicons name="close" size={10} color={colors.primaryHover} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.clearAllTag}
          onPress={() => {
            resetFilters();
            setSearchQuery('');
            applyFilters();
          }}
        >
          <Text style={styles.clearAllText}>Xóa tất cả</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      {/* Top Header constrained */}
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <Text style={styles.headerTitle}>Kho Xe Trực Tuyến</Text>

          {/* Search Bar & Filter trigger */}
          <SearchBar
            value={searchQuery}
            onChangeText={handleSearchChange}
            placeholder="Tìm dòng xe, hãng, phân khúc..."
            onFilterPress={() => setIsFilterModalVisible(true)}
            activeFilterCount={activeFilterCount}
            onAiPress={() => router.push('/(tabs)/ai-chat' as any)}
            style={{ marginTop: spacing.xs + 2 }}
          />

          {/* Active Filter Tags */}
          {renderActiveFilterTags()}

          {/* Subheader with View Switcher & Result Count */}
          <View style={styles.toolBar}>
            <Text style={styles.resultCount}>
              <Text style={styles.countBold}>{filteredCars.length}</Text> mẫu xe
            </Text>

            <View style={styles.viewToggleGroup}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setLayoutMode('grid')}
                style={[
                  styles.viewToggleBtn,
                  layoutMode === 'grid' && styles.viewToggleActive,
                ]}
              >
                <Ionicons
                  name="grid"
                  size={13}
                  color={layoutMode === 'grid' ? '#FFFFFF' : colors.textMuted}
                />
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setLayoutMode('list')}
                style={[
                  styles.viewToggleBtn,
                  layoutMode === 'list' && styles.viewToggleActive,
                ]}
              >
                <Ionicons
                  name="list"
                  size={13}
                  color={layoutMode === 'list' ? '#FFFFFF' : colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Car List */}
      {isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải danh sách xe...</Text>
        </View>
      ) : filteredCars.length === 0 ? (
        <EmptyState
          icon="search-outline"
          title="Không tìm thấy xe"
          description="Hãy thử nới lỏng bộ lọc hoặc trao đổi với trợ lý AI."
          actionTitle="Xóa bộ lọc"
          onAction={() => {
            resetFilters();
            setSearchQuery('');
            applyFilters();
          }}
        />
      ) : (
        <FlatList
          key={`catalog-${numColumns}-${layoutMode}`}
          data={filteredCars}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: car }) => {
            const isSaved = savedCars.some((sc) => sc.car_id === car.id);
            return (
              <CarCard
                car={car}
                layout={layoutMode}
                isSaved={isSaved}
                onPressDetails={handleCarDetails}
                onPressCompare={handleCarCompare}
                onPressAddToCart={handleAddToCart}
                onPressToggleSave={handleToggleSave}
                style={numColumns > 1 ? styles.gridCardItem : undefined}
              />
            );
          }}
        />
      )}

      {/* Filter Modal Drawer */}
      <CarFilterModal
        visible={isFilterModalVisible}
        onClose={() => setIsFilterModalVisible(false)}
        filters={filters}
        onApplyFilters={handleApplyModalFilters}
        onResetFilters={resetFilters}
      />
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
    maxWidth: 1200,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  activeFiltersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: spacing.xs,
  },
  filterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.sm,
    gap: 3,
    borderWidth: 0.5,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  filterTagText: {
    color: colors.primaryHover,
    fontSize: 11,
    fontWeight: typography.weights.medium,
  },
  clearAllTag: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    justifyContent: 'center',
  },
  clearAllText: {
    color: colors.danger,
    fontSize: 11,
    fontWeight: typography.weights.semibold,
  },
  toolBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs + 2,
  },
  resultCount: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
  },
  countBold: {
    color: colors.primaryHover,
    fontWeight: typography.weights.bold,
  },
  viewToggleGroup: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.xs,
    padding: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  viewToggleBtn: {
    width: 28,
    height: 24,
    borderRadius: radii.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewToggleActive: {
    backgroundColor: colors.primary,
  },
  listContainer: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm + 2,
    paddingBottom: 32,
  },
  columnWrapper: {
    gap: spacing.md,
  },
  gridCardItem: {
    flex: 1,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
  },
});
