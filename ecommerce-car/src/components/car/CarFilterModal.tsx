import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { colors, radii, spacing, typography } from '../../theme';
import { CarFilterParams, CarSortOption } from '../../types';
import { ModalSheet } from '../ui/ModalSheet';
import { Button } from '../ui/Button';

interface CarFilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: CarFilterParams;
  onApplyFilters: (newFilters: CarFilterParams) => void;
  onResetFilters: () => void;
}

const BRANDS = ['all', 'Porsche', 'Mercedes-Benz', 'BMW', 'Lexus', 'Audi', 'VinFast', 'Toyota', 'Honda', 'Mazda'];
const BODY_TYPES = ['all', 'Coupe / Thể thao', 'SUV Đô thị', 'Sedan Sang trọng', 'Xe Điện EV', '7 chỗ'];
const FUEL_TYPES = ['all', 'Xăng', 'Điện', 'Hybrid'];

const PRICE_RANGES = [
  { label: 'Tất cả mức giá', min: undefined, max: undefined },
  { label: 'Dưới 1 tỷ', min: 0, max: 1000000000 },
  { label: '1 - 2 tỷ', min: 1000000000, max: 2000000000 },
  { label: '2 - 5 tỷ', min: 2000000000, max: 5000000000 },
  { label: 'Trên 5 tỷ', min: 5000000000, max: 20000000000 },
];

const SORT_OPTIONS: { id: CarSortOption; label: string }[] = [
  { id: 'recommended', label: 'Gợi ý từ AI' },
  { id: 'price_asc', label: 'Giá tăng dần' },
  { id: 'price_desc', label: 'Giá giảm dần' },
  { id: 'hp_desc', label: 'Công suất (HP) cao' },
  { id: 'year_desc', label: 'Đời xe mới' },
];

export const CarFilterModal: React.FC<CarFilterModalProps> = ({
  visible,
  onClose,
  filters,
  onApplyFilters,
  onResetFilters,
}) => {
  const [selectedMake, setSelectedMake] = useState<string>(filters.make || 'all');
  const [selectedBodyType, setSelectedBodyType] = useState<string>(filters.bodyType || 'all');
  const [selectedFuelType, setSelectedFuelType] = useState<string>(filters.fuelType || 'all');
  const [selectedPriceRangeIndex, setSelectedPriceRangeIndex] = useState<number>(() => {
    if (!filters.minPrice && !filters.maxPrice) return 0;
    const idx = PRICE_RANGES.findIndex(
      (p) => p.min === filters.minPrice && p.max === filters.maxPrice
    );
    return idx >= 0 ? idx : 0;
  });
  const [selectedSort, setSelectedSort] = useState<CarSortOption>(
    filters.sortBy || 'recommended'
  );

  const handleApply = () => {
    const priceRange = PRICE_RANGES[selectedPriceRangeIndex];
    onApplyFilters({
      ...filters,
      make: selectedMake === 'all' ? undefined : selectedMake,
      bodyType: selectedBodyType === 'all' ? undefined : selectedBodyType,
      fuelType: selectedFuelType === 'all' ? undefined : selectedFuelType,
      minPrice: priceRange.min,
      maxPrice: priceRange.max,
      sortBy: selectedSort,
    });
    onClose();
  };

  const handleReset = () => {
    setSelectedMake('all');
    setSelectedBodyType('all');
    setSelectedFuelType('all');
    setSelectedPriceRangeIndex(0);
    setSelectedSort('recommended');
    onResetFilters();
    onClose();
  };

  return (
    <ModalSheet
      visible={visible}
      onClose={onClose}
      title="Bộ Lọc Tìm Kiếm"
      subtitle="Tùy chỉnh tiêu chí Showroom"
    >
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        {/* Sort Options */}
        <Text style={styles.sectionHeader}>Sắp xếp</Text>
        <View style={styles.chipsContainer}>
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.id}
              activeOpacity={0.8}
              onPress={() => setSelectedSort(opt.id)}
              style={[
                styles.chip,
                selectedSort === opt.id ? styles.chipActive : styles.chipInactive,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedSort === opt.id ? styles.chipTextActive : styles.chipTextInactive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Brand/Make */}
        <Text style={styles.sectionHeader}>Hãng xe</Text>
        <View style={styles.chipsContainer}>
          {BRANDS.map((b) => (
            <TouchableOpacity
              key={b}
              activeOpacity={0.8}
              onPress={() => setSelectedMake(b)}
              style={[
                styles.chip,
                selectedMake === b ? styles.chipActive : styles.chipInactive,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedMake === b ? styles.chipTextActive : styles.chipTextInactive,
                ]}
              >
                {b === 'all' ? 'Tất cả hãng' : b}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Body Type */}
        <Text style={styles.sectionHeader}>Kiểu dáng</Text>
        <View style={styles.chipsContainer}>
          {BODY_TYPES.map((bt) => (
            <TouchableOpacity
              key={bt}
              activeOpacity={0.8}
              onPress={() => setSelectedBodyType(bt)}
              style={[
                styles.chip,
                selectedBodyType === bt ? styles.chipActive : styles.chipInactive,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedBodyType === bt ? styles.chipTextActive : styles.chipTextInactive,
                ]}
              >
                {bt === 'all' ? 'Tất cả' : bt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Price Range */}
        <Text style={styles.sectionHeader}>Khoảng giá</Text>
        <View style={styles.chipsContainer}>
          {PRICE_RANGES.map((pr, idx) => (
            <TouchableOpacity
              key={pr.label}
              activeOpacity={0.8}
              onPress={() => setSelectedPriceRangeIndex(idx)}
              style={[
                styles.chip,
                selectedPriceRangeIndex === idx ? styles.chipActive : styles.chipInactive,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedPriceRangeIndex === idx ? styles.chipTextActive : styles.chipTextInactive,
                ]}
              >
                {pr.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Fuel Type */}
        <Text style={styles.sectionHeader}>Nhiên liệu / Động cơ</Text>
        <View style={styles.chipsContainer}>
          {FUEL_TYPES.map((ft) => (
            <TouchableOpacity
              key={ft}
              activeOpacity={0.8}
              onPress={() => setSelectedFuelType(ft)}
              style={[
                styles.chip,
                selectedFuelType === ft ? styles.chipActive : styles.chipInactive,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedFuelType === ft ? styles.chipTextActive : styles.chipTextInactive,
                ]}
              >
                {ft === 'all' ? 'Tất cả' : ft}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Đặt lại"
          variant="outline"
          onPress={handleReset}
          style={styles.resetBtn}
        />
        <Button
          title="Áp Dụng"
          variant="primary"
          onPress={handleApply}
          style={styles.applyBtn}
        />
      </View>
    </ModalSheet>
  );
};

const styles = StyleSheet.create({
  scroll: {
    maxHeight: 440,
  },
  sectionHeader: {
    color: colors.text,
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.semibold,
    marginTop: spacing.sm + 2,
    marginBottom: 6,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: 4,
  },
  chip: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radii.xs,
    borderWidth: 1,
  },
  chipInactive: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: typography.sizes['2xs'] + 1,
    fontWeight: typography.weights.medium,
  },
  chipTextInactive: {
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.primaryHover,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  resetBtn: {
    flex: 1,
  },
  applyBtn: {
    flex: 2,
  },
});

