import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '../../theme';
import { useCarStore } from '../../store/useCarStore';
import { globalAlert } from '../../store/useDialogStore';
import { carService } from '../../services/carService';
import { useResponsive } from '../../hooks/useResponsive';
import { ResponsiveContainer } from '../../components/ui/ResponsiveContainer';
import { Card } from '../../components/ui/Card';
import { DepositButton } from '../../components/car/DepositButton';
import { CarPickerModal } from '../../components/car/CarPickerModal';
import { formatVndPrice } from '../../components/ui/PriceTag';
import { Car, CarResponse } from '../../types';
import { FALLBACK_CAR_URL } from '../../constants/images';

export default function CompareScreen() {
  const params = useLocalSearchParams<{ ids?: string }>();
  const { topCars, fetchTopCars, isLoading: isTopCarsLoading } = useCarStore();
  const { isLargeScreen } = useResponsive();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [extraCars, setExtraCars] = useState<Car[]>([]);
  const [isExtraLoading, setIsExtraLoading] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [highlightDifferences, setHighlightDifferences] = useState(true);

  useEffect(() => {
    fetchTopCars();
  }, [fetchTopCars]);

  // Synchronize URL query params if provided
  useEffect(() => {
    if (params.ids) {
      const idsFromParams = params.ids
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (idsFromParams.length > 0) {
        const timer = setTimeout(() => {
          setSelectedIds(idsFromParams);
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [params.ids]);

  // Fetch details for any selected cars not present in topCars
  const fetchMissingCars = useCallback(async (idsToFetch: string[]) => {
    if (idsToFetch.length === 0) return;
    setIsExtraLoading(true);
    try {
      const fetched = await carService.getCarsByIds(idsToFetch);
      if (fetched && fetched.length > 0) {
        setExtraCars((prev) => {
          const map = new Map(prev.map((c) => [c.id, c]));
          fetched.forEach((c) => map.set(c.id, c));
          return Array.from(map.values());
        });
      }
    } catch (err) {
      console.warn('[CompareScreen] Error fetching missing cars:', err);
    } finally {
      setIsExtraLoading(false);
    }
  }, []);

  useEffect(() => {
    const knownIds = new Set([...topCars.map((c) => c.id), ...extraCars.map((c) => c.id)]);
    const missing = selectedIds.filter((id) => !knownIds.has(id));
    if (missing.length > 0) {
      const timer = setTimeout(() => {
        fetchMissingCars(missing);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [selectedIds, topCars, extraCars, fetchMissingCars]);

  const allKnownCars = useMemo(() => {
    const map = new Map<string, Car>();
    topCars.forEach((c) => map.set(c.id, c));
    extraCars.forEach((c) => map.set(c.id, c));
    return Array.from(map.values());
  }, [topCars, extraCars]);

  const comparedCars: CarResponse[] = useMemo(() => {
    return selectedIds
      .map((id) => allKnownCars.find((c) => c.id === id))
      .filter(Boolean)
      .map((c) => ({
        id: c!.id,
        make: c!.make,
        model: c!.model,
        year: c!.year,
        engine_hp: c!.engine_hp || undefined,
        price: c!.price || undefined,
        metadata: c!.metadata || undefined,
        image_url: c!.image_url || undefined,
      }));
  }, [selectedIds, allKnownCars]);

  const removeCar = (carId: string) => {
    setSelectedIds((prev) => prev.filter((id) => id !== carId));
  };

  const addCarToCompare = (carId: string) => {
    if (selectedIds.includes(carId)) {
      globalAlert('Thông báo', 'Mẫu xe này đã có trong danh sách so sánh.');
      return;
    }
    if (selectedIds.length >= 4) {
      globalAlert('Giới hạn', 'Bạn có thể so sánh tối đa 4 xe cùng lúc.');
      return;
    }
    setSelectedIds((prev) => [...prev, carId]);
    setIsAddModalVisible(false);
  };


  const fallbackImage = FALLBACK_CAR_URL;
  const colWidth = isLargeScreen ? 180 : 145;
  const isLoading = isTopCarsLoading || isExtraLoading;

  return (
    <View style={styles.screen}>
      <ResponsiveContainer scrollable maxWidth="xl" showsVerticalScrollIndicator={false}>
        {/* Header Title Bar */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={styles.titleLeft}>
              {router.canGoBack() && (
                <TouchableOpacity
                  onPress={() => router.back()}
                  style={styles.backBtn}
                  activeOpacity={0.7}
                >
                  <Ionicons name="arrow-back" size={18} color={colors.text} />
                </TouchableOpacity>
              )}
              <Ionicons name="git-compare-outline" size={18} color={colors.primaryHover} style={{ marginRight: 6 }} />
              <Text style={styles.title}>So Sánh Thông Số Xe</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.addCarBtn}
              onPress={() => setIsAddModalVisible(true)}
            >
              <Ionicons name="add" size={14} color="#FFFFFF" />
              <Text style={styles.addCarBtnText}>Thêm xe</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Empty State */}
        {comparedCars.length === 0 ? (
          <Card style={styles.emptyContainer} padding={spacing.lg}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="git-compare-outline" size={36} color={colors.primaryHover} />
            </View>
            <Text style={styles.emptyTitle}>Bảng so sánh đang trống</Text>
            <Text style={styles.emptySubtitle}>
              Chọn tối thiểu 2 mẫu xe từ kho xe để so sánh chi tiết các thông số kỹ thuật, hoặc nhận tư vấn đối chiếu thông minh từ AI Match.
            </Text>
            <View style={styles.emptyActionRow}>
              <TouchableOpacity
                style={styles.emptyPrimaryBtn}
                activeOpacity={0.8}
                onPress={() => setIsAddModalVisible(true)}
              >
                <Ionicons name="add-circle-outline" size={16} color="#FFFFFF" />
                <Text style={styles.emptyPrimaryBtnText}>Chọn xe so sánh</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.emptySecondaryBtn}
                activeOpacity={0.8}
                onPress={() => router.push('/(tabs)/ai-chat' as any)}
              >
                <Ionicons name="sparkles-outline" size={15} color={colors.primaryHover} />
                <Text style={styles.emptySecondaryBtnText}>Nhận gợi ý từ AI Match</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ) : (
          <>
            {/* Comparison Options Bar */}
            <Card style={styles.aiSummaryCard} padding={spacing.sm}>
              <View style={styles.optionsRow}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setHighlightDifferences(!highlightDifferences)}
                  style={styles.toggleDiffRow}
                >
                  <Ionicons
                    name={highlightDifferences ? 'checkbox' : 'square-outline'}
                    size={15}
                    color={colors.primaryHover}
                  />
                  <Text style={styles.toggleDiffText}>Làm nổi bật thông số khác biệt</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setSelectedIds([])}
                  style={styles.clearAllBtn}
                >
                  <Ionicons name="trash-outline" size={13} color={colors.textMuted} />
                  <Text style={styles.clearAllText}>Xóa tất cả</Text>
                </TouchableOpacity>
              </View>
            </Card>

            {isLoading && comparedCars.length === 0 ? (
              <ActivityIndicator color={colors.primary} size="small" style={{ marginVertical: 30 }} />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tableScroll}>
                <View style={styles.table}>
                  {/* Header Row: Car Info & Actions */}
                  <View style={styles.tableRow}>
                    <View style={styles.labelCol}>
                      <Text style={styles.tableHeaderLabel}>Mẫu xe ({comparedCars.length})</Text>
                    </View>
                    {comparedCars.map((car) => (
                      <View key={car.id} style={[styles.carCol, { width: colWidth }]}>
                        <TouchableOpacity
                          style={styles.closeBtn}
                          onPress={() => removeCar(car.id)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                        </TouchableOpacity>

                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => router.push(`/car/${car.id}` as any)}
                        >
                          <Image
                            source={{ uri: car.image_url || fallbackImage }}
                            style={[styles.thumbImage, { width: colWidth - 20 }]}
                            contentFit="cover"
                          />
                          <Text style={styles.carName} numberOfLines={2}>
                            {car.make} {car.model}
                          </Text>
                        </TouchableOpacity>

                        <Text style={styles.metricValueSmall}>Năm {car.year}</Text>

                        <DepositButton
                          carId={car.id}
                          size="sm"
                          style={styles.colActionBtn}
                        />
                      </View>
                    ))}

                    {/* Placeholder Slot to add 2nd car if only 1 is selected */}
                    {comparedCars.length === 1 && (
                      <TouchableOpacity
                        style={[styles.addSlotCol, { width: colWidth }]}
                        activeOpacity={0.8}
                        onPress={() => setIsAddModalVisible(true)}
                      >
                        <View style={styles.addSlotIconCircle}>
                          <Ionicons name="add" size={20} color={colors.primaryHover} />
                        </View>
                        <Text style={styles.addSlotTitle}>Thêm xe thứ 2</Text>
                        <Text style={styles.addSlotSubtitle}>để đối chiếu thông số</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Metric 1: Price */}
                  <View style={[styles.tableRow, highlightDifferences && styles.diffRow]}>
                    <View style={styles.labelCol}>
                      <Text style={styles.metricLabel}>Giá Niêm Yết</Text>
                    </View>
                    {comparedCars.map((car) => (
                      <View key={car.id} style={[styles.carCol, { width: colWidth }]}>
                        <Text style={styles.metricValueHighlight}>
                          {formatVndPrice(car.price, 'usd', {
                            engineHp: car.engine_hp,
                            fuelType: car.metadata?.engine_fuel_type || car.metadata?.fuel_type,
                          })}
                        </Text>
                      </View>
                    ))}
                    {comparedCars.length === 1 && <View style={[styles.carCol, { width: colWidth }]} />}
                  </View>

                  {/* Metric 2: Engine HP */}
                  <View style={styles.tableRowAlt}>
                    <View style={styles.labelCol}>
                      <Text style={styles.metricLabel}>Công Suất</Text>
                    </View>
                    {comparedCars.map((car) => (
                      <View key={car.id} style={[styles.carCol, { width: colWidth }]}>
                        <Text style={styles.metricValue}>
                          {car.engine_hp ? `${car.engine_hp} HP` : 'N/A'}
                        </Text>
                      </View>
                    ))}
                    {comparedCars.length === 1 && <View style={[styles.carCol, { width: colWidth }]} />}
                  </View>

                  {/* Metric 3: Torque */}
                  <View style={styles.tableRow}>
                    <View style={styles.labelCol}>
                      <Text style={styles.metricLabel}>Mô-men xoắn</Text>
                    </View>
                    {comparedCars.map((car) => (
                      <View key={car.id} style={[styles.carCol, { width: colWidth }]}>
                        <Text style={styles.metricValueSmall}>
                          {car.metadata?.torque || 'Đang cập nhật'}
                        </Text>
                      </View>
                    ))}
                    {comparedCars.length === 1 && <View style={[styles.carCol, { width: colWidth }]} />}
                  </View>

                  {/* Metric 4: 0-100 km/h */}
                  <View style={styles.tableRowAlt}>
                    <View style={styles.labelCol}>
                      <Text style={styles.metricLabel}>Tăng tốc 0-100</Text>
                    </View>
                    {comparedCars.map((car) => (
                      <View key={car.id} style={[styles.carCol, { width: colWidth }]}>
                        <Text style={styles.metricValueSmall}>
                          {car.metadata?.acceleration_0_100 || 'N/A'}
                        </Text>
                      </View>
                    ))}
                    {comparedCars.length === 1 && <View style={[styles.carCol, { width: colWidth }]} />}
                  </View>

                  {/* Metric 5: Fuel Type */}
                  <View style={styles.tableRow}>
                    <View style={styles.labelCol}>
                      <Text style={styles.metricLabel}>Nhiên Liệu</Text>
                    </View>
                    {comparedCars.map((car) => (
                      <View key={car.id} style={[styles.carCol, { width: colWidth }]}>
                        <Text style={styles.metricValueSmall}>
                          {car.metadata?.fuel_type || 'Xăng'}
                        </Text>
                      </View>
                    ))}
                    {comparedCars.length === 1 && <View style={[styles.carCol, { width: colWidth }]} />}
                  </View>

                  {/* Metric 6: Transmission */}
                  <View style={styles.tableRowAlt}>
                    <View style={styles.labelCol}>
                      <Text style={styles.metricLabel}>Hộp Số</Text>
                    </View>
                    {comparedCars.map((car) => (
                      <View key={car.id} style={[styles.carCol, { width: colWidth }]}>
                        <Text style={styles.metricValueSmall}>
                          {car.metadata?.transmission || 'Tự động'}
                        </Text>
                      </View>
                    ))}
                    {comparedCars.length === 1 && <View style={[styles.carCol, { width: colWidth }]} />}
                  </View>

                  {/* Metric 7: Seats */}
                  <View style={styles.tableRow}>
                    <View style={styles.labelCol}>
                      <Text style={styles.metricLabel}>Số Chỗ Ngồi</Text>
                    </View>
                    {comparedCars.map((car) => (
                      <View key={car.id} style={[styles.carCol, { width: colWidth }]}>
                        <Text style={styles.metricValueSmall}>
                          {car.metadata?.seating_capacity ? `${car.metadata.seating_capacity} chỗ` : '5 chỗ'}
                        </Text>
                      </View>
                    ))}
                    {comparedCars.length === 1 && <View style={[styles.carCol, { width: colWidth }]} />}
                  </View>

                  {/* Metric 8: Fuel Economy */}
                  <View style={styles.tableRowAlt}>
                    <View style={styles.labelCol}>
                      <Text style={styles.metricLabel}>Mức Tiêu Thụ</Text>
                    </View>
                    {comparedCars.map((car) => (
                      <View key={car.id} style={[styles.carCol, { width: colWidth }]}>
                        <Text style={styles.metricValueSmall}>
                          {car.metadata?.fuel_economy || 'N/A'}
                        </Text>
                      </View>
                    ))}
                    {comparedCars.length === 1 && <View style={[styles.carCol, { width: colWidth }]} />}
                  </View>
                </View>
              </ScrollView>
            )}
          </>
        )}

        {/* Add Car Modal */}
        <CarPickerModal
          visible={isAddModalVisible}
          onClose={() => setIsAddModalVisible(false)}
          onSelectCar={addCarToCompare}
          excludeIds={selectedIds}
        />

        <View style={{ height: 24 }} />
      </ResponsiveContainer>
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
    paddingBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: spacing.xs + 2,
    padding: 4,
  },
  title: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  addCarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: radii.full,
    gap: 4,
  },
  addCarBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: typography.weights.semibold,
  },
  emptyContainer: {
    marginTop: spacing.xl,
    alignItems: 'center',
    textAlign: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: spacing['3xl'],
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 340,
    marginBottom: spacing.lg,
  },
  emptyActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  emptyPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
  },
  emptyPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: typography.weights.semibold,
  },
  emptySecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
  },
  emptySecondaryBtnText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: typography.weights.medium,
  },
  aiSummaryCard: {
    marginBottom: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleDiffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toggleDiffText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  clearAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  clearAllText: {
    color: colors.textMuted,
    fontSize: 11,
  },
  tableScroll: {
    marginBottom: spacing.xl,
  },
  table: {
    backgroundColor: colors.cardBg,
    borderRadius: radii.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  tableRowAlt: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  diffRow: {
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
  },
  labelCol: {
    width: 110,
    paddingHorizontal: spacing.sm + 2,
  },
  tableHeaderLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: typography.weights.medium,
  },
  carCol: {
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: -2,
    right: 2,
    zIndex: 10,
  },
  thumbImage: {
    height: 75,
    borderRadius: radii.sm,
    marginBottom: 4,
  },
  carName: {
    color: colors.text,
    fontSize: 11,
    fontWeight: typography.weights.semibold,
    textAlign: 'center',
    lineHeight: 15,
    height: 30,
  },
  colActionBtn: {
    width: '100%',
    height: 30,
    marginTop: 4,
  },
  addSlotCol: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: radii.md,
    marginHorizontal: spacing.xs,
  },
  addSlotIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  addSlotTitle: {
    color: colors.text,
    fontSize: 11,
    fontWeight: typography.weights.semibold,
  },
  addSlotSubtitle: {
    color: colors.textMuted,
    fontSize: 9,
    marginTop: 2,
  },
  metricLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: typography.weights.regular,
  },
  metricValue: {
    color: colors.text,
    fontSize: 11,
    fontWeight: typography.weights.semibold,
  },
  metricValueHighlight: {
    color: colors.primaryHover,
    fontSize: 11,
    fontWeight: typography.weights.bold,
  },
  metricValueSmall: {
    color: colors.text,
    fontSize: 10,
    textAlign: 'center',
  },
});
