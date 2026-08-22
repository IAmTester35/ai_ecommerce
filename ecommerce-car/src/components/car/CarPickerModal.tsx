import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '../../theme';
import { carService } from '../../services/carService';
import { Car, CarFilterParams } from '../../types';
import { ModalSheet } from '../ui/ModalSheet';
import { SearchBar } from '../ui/SearchBar';
import { PillFilter, PillOption } from '../ui/PillFilter';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { formatVndPrice } from '../ui/PriceTag';
import { FALLBACK_CAR_URL } from '../../constants/images';

interface CarPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectCar: (carId: string) => void;
  excludeIds?: string[];
}

const BRAND_PILLS: PillOption<string>[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'Porsche', label: 'Porsche' },
  { id: 'Mercedes-Benz', label: 'Mercedes' },
  { id: 'BMW', label: 'BMW' },
  { id: 'VinFast', label: 'VinFast' },
  { id: 'Lexus', label: 'Lexus' },
  { id: 'Audi', label: 'Audi' },
  { id: 'Toyota', label: 'Toyota' },
  { id: 'Honda', label: 'Honda' },
  { id: 'Mazda', label: 'Mazda' },
];

const PRICE_RANGES = [
  { label: 'Tất cả giá', min: undefined, max: undefined },
  { label: '< 1 tỷ', min: 0, max: 1000000000 },
  { label: '1 - 2 tỷ', min: 1000000000, max: 2000000000 },
  { label: '2 - 5 tỷ', min: 2000000000, max: 5000000000 },
  { label: '> 5 tỷ', min: 5000000000, max: 20000000000 },
];

const BODY_TYPES = ['all', 'SUV Đô thị', 'Sedan Sang trọng', 'Coupe / Thể thao', 'Xe Điện EV'];
const FUEL_TYPES = ['all', 'Xăng', 'Điện', 'Hybrid'];

export const CarPickerModal: React.FC<CarPickerModalProps> = ({
  visible,
  onClose,
  onSelectCar,
  excludeIds = [],
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedPriceIndex, setSelectedPriceIndex] = useState(0);
  const [selectedBodyType, setSelectedBodyType] = useState('all');
  const [selectedFuelType, setSelectedFuelType] = useState('all');
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  const [cars, setCars] = useState<Car[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Compute active non-default filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedBrand !== 'all') count++;
    if (selectedPriceIndex !== 0) count++;
    if (selectedBodyType !== 'all') count++;
    if (selectedFuelType !== 'all') count++;
    return count;
  }, [selectedBrand, selectedPriceIndex, selectedBodyType, selectedFuelType]);

  const loadCars = useCallback(async () => {
    setIsLoading(true);
    try {
      const priceRange = PRICE_RANGES[selectedPriceIndex];
      const params: CarFilterParams = {
        query: searchQuery.trim() || undefined,
        make: selectedBrand !== 'all' ? selectedBrand : undefined,
        bodyType: selectedBodyType !== 'all' ? selectedBodyType : undefined,
        fuelType: selectedFuelType !== 'all' ? selectedFuelType : undefined,
        minPrice: priceRange.min,
        maxPrice: priceRange.max,
        limit: 50,
      };

      const results = await carService.getCarsWithFilter(params);
      setCars(results);
    } catch (err) {
      console.warn('[CarPickerModal] Error fetching cars:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedBrand, selectedPriceIndex, selectedBodyType, selectedFuelType]);

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        loadCars();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [visible, loadCars]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedBrand('all');
    setSelectedPriceIndex(0);
    setSelectedBodyType('all');
    setSelectedFuelType('all');
  };

  const availableCars = useMemo(() => {
    return cars.filter((c) => !excludeIds.includes(c.id));
  }, [cars, excludeIds]);

  return (
    <ModalSheet
      visible={visible}
      onClose={onClose}
      title="Thêm Xe So Sánh"
      subtitle="Tìm kiếm & chọn mẫu xe"
    >
      <View style={styles.container}>
        {/* Search & Filter Bar */}
        <View style={styles.searchSection}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Tìm theo tên, hãng, dòng xe..."
            onFilterPress={() => setIsFilterExpanded(!isFilterExpanded)}
            activeFilterCount={activeFilterCount}
            onClear={() => setSearchQuery('')}
          />

          {/* Quick Brand Pills */}
          <View style={styles.pillsWrapper}>
            <PillFilter
              options={BRAND_PILLS}
              selectedId={selectedBrand}
              onSelect={setSelectedBrand}
            />
          </View>

          {/* Expandable Advanced Filters */}
          {isFilterExpanded && (
            <View style={styles.filterPanel}>
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Khoảng giá</Text>
                <View style={styles.chipsRow}>
                  {PRICE_RANGES.map((pr, idx) => (
                    <TouchableOpacity
                      key={pr.label}
                      activeOpacity={0.8}
                      onPress={() => setSelectedPriceIndex(idx)}
                      style={[
                        styles.filterChip,
                        selectedPriceIndex === idx ? styles.filterChipActive : styles.filterChipInactive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          selectedPriceIndex === idx ? styles.filterChipTextActive : styles.filterChipTextInactive,
                        ]}
                      >
                        {pr.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Kiểu dáng</Text>
                <View style={styles.chipsRow}>
                  {BODY_TYPES.map((bt) => (
                    <TouchableOpacity
                      key={bt}
                      activeOpacity={0.8}
                      onPress={() => setSelectedBodyType(bt)}
                      style={[
                        styles.filterChip,
                        selectedBodyType === bt ? styles.filterChipActive : styles.filterChipInactive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          selectedBodyType === bt ? styles.filterChipTextActive : styles.filterChipTextInactive,
                        ]}
                      >
                        {bt === 'all' ? 'Tất cả' : bt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Nhiên liệu</Text>
                <View style={styles.chipsRow}>
                  {FUEL_TYPES.map((ft) => (
                    <TouchableOpacity
                      key={ft}
                      activeOpacity={0.8}
                      onPress={() => setSelectedFuelType(ft)}
                      style={[
                        styles.filterChip,
                        selectedFuelType === ft ? styles.filterChipActive : styles.filterChipInactive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          selectedFuelType === ft ? styles.filterChipTextActive : styles.filterChipTextInactive,
                        ]}
                      >
                        {ft === 'all' ? 'Tất cả' : ft}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {activeFilterCount > 0 && (
                <TouchableOpacity
                  style={styles.resetFilterBtn}
                  activeOpacity={0.7}
                  onPress={handleResetFilters}
                >
                  <Ionicons name="refresh-outline" size={13} color={colors.textSecondary} />
                  <Text style={styles.resetFilterText}>Đặt lại bộ lọc</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Results Header */}
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>
            {isLoading ? 'Đang tìm...' : `${availableCars.length} mẫu xe sẵn sàng`}
          </Text>
          {excludeIds.length > 0 && (
            <Text style={styles.excludedCount}>
              Đã chọn: {excludeIds.length}/4
            </Text>
          )}
        </View>

        {/* Scrollable Car List with custom sleek scroll */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primaryHover} />
            <Text style={styles.loadingText}>Đang nạp danh sách xe...</Text>
          </View>
        ) : (
          <FlatList
            data={availableCars}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            style={styles.listContainer}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <EmptyState
                icon="car-outline"
                title="Không tìm thấy xe phù hợp"
                description="Thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh bộ lọc giá và hãng xe."
                actionTitle="Đặt lại bộ lọc"
                onAction={handleResetFilters}
                style={{ marginVertical: spacing.md }}
              />
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.carRowItem}
                onPress={() => onSelectCar(item.id)}
              >
                <Image
                  source={{ uri: item.image_url || FALLBACK_CAR_URL }}
                  style={styles.carRowThumb}
                  contentFit="cover"
                />

                <View style={styles.carRowInfo}>
                  <Text style={styles.carRowTitle} numberOfLines={1}>
                    {item.make} {item.model}
                  </Text>
                  <Text style={styles.carRowPrice}>
                    {formatVndPrice(item.price, 'usd', {
                      engineHp: item.engine_hp,
                      fuelType: item.metadata?.engine_fuel_type || item.metadata?.fuel_type,
                    })}
                  </Text>

                  <View style={styles.carRowMeta}>
                    <Text style={styles.metaBadge}>{item.year}</Text>
                    {item.engine_hp && (
                      <Text style={styles.metaBadge}>{item.engine_hp} HP</Text>
                    )}
                    {item.metadata?.fuel_type && (
                      <Text style={styles.metaBadge}>{item.metadata.fuel_type}</Text>
                    )}
                  </View>
                </View>

                <Button
                  title="Thêm"
                  variant="primary"
                  size="sm"
                  onPress={() => onSelectCar(item.id)}
                  style={styles.selectBtn}
                />
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </ModalSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  searchSection: {
    marginBottom: spacing.xs,
  },
  pillsWrapper: {
    marginTop: spacing.xs,
  },
  filterPanel: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.sm,
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  filterSection: {
    marginBottom: 8,
  },
  filterSectionTitle: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: typography.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  filterChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.xs,
    borderWidth: 1,
  },
  filterChipInactive: {
    backgroundColor: colors.surfaceElevated,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  filterChipActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: 'rgba(59, 130, 246, 0.35)',
  },
  filterChipText: {
    fontSize: 10,
  },
  filterChipTextInactive: {
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.primaryHover,
    fontWeight: typography.weights.semibold,
  },
  resetFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 4,
    marginTop: 2,
  },
  resetFilterText: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 2,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
    marginBottom: 6,
  },
  resultsCount: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: typography.weights.medium,
  },
  excludedCount: {
    color: colors.primaryHover,
    fontSize: 11,
    fontWeight: typography.weights.semibold,
  },
  listContainer: {
    maxHeight: 380,
    minHeight: 220,
  },
  listContent: {
    paddingBottom: spacing.sm,
  },
  loadingContainer: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  carRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.sm,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  carRowThumb: {
    width: 64,
    height: 44,
    borderRadius: radii.xs,
    marginRight: spacing.sm,
  },
  carRowInfo: {
    flex: 1,
    marginRight: spacing.xs,
  },
  carRowTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: typography.weights.semibold,
    lineHeight: 16,
  },
  carRowPrice: {
    color: colors.primaryHover,
    fontSize: 12,
    fontWeight: typography.weights.bold,
    marginTop: 1,
  },
  carRowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  metaBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    color: colors.textSecondary,
    fontSize: 9,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  selectBtn: {
    height: 32,
    paddingHorizontal: spacing.sm + 2,
  },
});
