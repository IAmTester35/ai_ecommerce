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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ ids?: string }>();
  const { topCars, fetchTopCars, isLoading: isTopCarsLoading } = useCarStore();
  const { isLargeScreen } = useResponsive();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [extraCars, setExtraCars] = useState<Car[]>([]);
  const [isExtraLoading, setIsExtraLoading] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [highlightDifferences, setHighlightDifferences] = useState(true);
  const [compareMode, setCompareMode] = useState<'battle' | 'table'>('battle');

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
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 44) }]}>
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
            {/* Mode Switcher on Mobile when 2 cars */}
            {comparedCars.length === 2 && !isLargeScreen && (
              <View style={styles.modeSwitcher}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setCompareMode('battle')}
                  style={[styles.modeBtn, compareMode === 'battle' && styles.modeBtnActive]}
                >
                  <Ionicons
                    name="flash"
                    size={13}
                    color={compareMode === 'battle' ? '#FFFFFF' : colors.textSecondary}
                  />
                  <Text style={[styles.modeBtnText, compareMode === 'battle' && styles.modeBtnTextActive]}>
                    Đối Đầu 1 vs 1
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setCompareMode('table')}
                  style={[styles.modeBtn, compareMode === 'table' && styles.modeBtnActive]}
                >
                  <Ionicons
                    name="grid-outline"
                    size={13}
                    color={compareMode === 'table' ? '#FFFFFF' : colors.textSecondary}
                  />
                  <Text style={[styles.modeBtnText, compareMode === 'table' && styles.modeBtnTextActive]}>
                    Bảng Chi Tiết
                  </Text>
                </TouchableOpacity>
              </View>
            )}

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
                  <Text style={styles.toggleDiffText}>Làm nổi bật điểm khác biệt</Text>
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

            {compareMode === 'battle' && comparedCars.length === 2 && !isLargeScreen ? (
              /* Mobile Head-to-Head 1vs1 Battle View */
              <View style={styles.battleContainer}>
                {/* 2 Cars Header */}
                <View style={styles.battleHeaderRow}>
                  {/* Car 1 */}
                  <View style={styles.battleCarCard}>
                    <TouchableOpacity
                      style={styles.battleRemoveBtn}
                      onPress={() => removeCar(comparedCars[0].id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                    <Image
                      source={{ uri: comparedCars[0].image_url || fallbackImage }}
                      style={styles.battleCarImg}
                      contentFit="cover"
                    />
                    <Text style={styles.battleCarName} numberOfLines={2}>
                      {comparedCars[0].make} {comparedCars[0].model}
                    </Text>
                    <Text style={styles.battleCarPrice}>
                      {formatVndPrice(comparedCars[0].price)}
                    </Text>
                  </View>

                  <View style={styles.battleVsCircle}>
                    <Text style={styles.battleVsText}>VS</Text>
                  </View>

                  {/* Car 2 */}
                  <View style={styles.battleCarCard}>
                    <TouchableOpacity
                      style={styles.battleRemoveBtn}
                      onPress={() => removeCar(comparedCars[1].id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                    <Image
                      source={{ uri: comparedCars[1].image_url || fallbackImage }}
                      style={styles.battleCarImg}
                      contentFit="cover"
                    />
                    <Text style={styles.battleCarName} numberOfLines={2}>
                      {comparedCars[1].make} {comparedCars[1].model}
                    </Text>
                    <Text style={styles.battleCarPrice}>
                      {formatVndPrice(comparedCars[1].price)}
                    </Text>
                  </View>
                </View>

                {/* Battle Spec Comparisons */}
                <View style={styles.battleMatrixCard}>
                  {/* Row: Công suất */}
                  <View style={styles.battleSpecRow}>
                    <View style={styles.battleColLeft}>
                      <Text style={[styles.battleValText, (comparedCars[0].engine_hp || 0) >= (comparedCars[1].engine_hp || 0) && styles.winnerVal]}>
                        {comparedCars[0].engine_hp ? `${comparedCars[0].engine_hp} HP` : 'N/A'}
                      </Text>
                      {(comparedCars[0].engine_hp || 0) > (comparedCars[1].engine_hp || 0) && (
                        <View style={styles.winnerBadge}><Text style={styles.winnerBadgeText}>Mạnh hơn</Text></View>
                      )}
                    </View>
                    <View style={styles.battleColCenter}>
                      <Ionicons name="speedometer-outline" size={14} color={colors.primaryHover} />
                      <Text style={styles.battleSpecLabel}>Công suất</Text>
                    </View>
                    <View style={styles.battleColRight}>
                      <Text style={[styles.battleValText, (comparedCars[1].engine_hp || 0) >= (comparedCars[0].engine_hp || 0) && styles.winnerVal]}>
                        {comparedCars[1].engine_hp ? `${comparedCars[1].engine_hp} HP` : 'N/A'}
                      </Text>
                      {(comparedCars[1].engine_hp || 0) > (comparedCars[0].engine_hp || 0) && (
                        <View style={styles.winnerBadge}><Text style={styles.winnerBadgeText}>Mạnh hơn</Text></View>
                      )}
                    </View>
                  </View>

                  {/* Row: Nhiên liệu */}
                  <View style={styles.battleSpecRow}>
                    <View style={styles.battleColLeft}>
                      <Text style={styles.battleValText} numberOfLines={1}>
                        {comparedCars[0].metadata?.fuel_type || 'Xăng'}
                      </Text>
                    </View>
                    <View style={styles.battleColCenter}>
                      <Ionicons name="flash-outline" size={14} color={colors.secondaryHover} />
                      <Text style={styles.battleSpecLabel}>Nhiên liệu</Text>
                    </View>
                    <View style={styles.battleColRight}>
                      <Text style={styles.battleValText} numberOfLines={1}>
                        {comparedCars[1].metadata?.fuel_type || 'Xăng'}
                      </Text>
                    </View>
                  </View>

                  {/* Row: Hộp số */}
                  <View style={styles.battleSpecRow}>
                    <View style={styles.battleColLeft}>
                      <Text style={styles.battleValText} numberOfLines={1}>
                        {comparedCars[0].metadata?.transmission || 'Tự động'}
                      </Text>
                    </View>
                    <View style={styles.battleColCenter}>
                      <Ionicons name="cog-outline" size={14} color={colors.success} />
                      <Text style={styles.battleSpecLabel}>Hộp số</Text>
                    </View>
                    <View style={styles.battleColRight}>
                      <Text style={styles.battleValText} numberOfLines={1}>
                        {comparedCars[1].metadata?.transmission || 'Tự động'}
                      </Text>
                    </View>
                  </View>

                  {/* Row: Số chỗ */}
                  <View style={styles.battleSpecRow}>
                    <View style={styles.battleColLeft}>
                      <Text style={styles.battleValText}>
                        {comparedCars[0].metadata?.seating_capacity || 5} chỗ
                      </Text>
                    </View>
                    <View style={styles.battleColCenter}>
                      <Ionicons name="people-outline" size={14} color={colors.conflict} />
                      <Text style={styles.battleSpecLabel}>Số chỗ</Text>
                    </View>
                    <View style={styles.battleColRight}>
                      <Text style={styles.battleValText}>
                        {comparedCars[1].metadata?.seating_capacity || 5} chỗ
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Actions */}
                <View style={styles.battleActionsRow}>
                  <DepositButton carId={comparedCars[0].id} title="Đặt Cọc Xe 1" size="sm" directCheckout style={{ flex: 1 }} />
                  <DepositButton carId={comparedCars[1].id} title="Đặt Cọc Xe 2" size="sm" directCheckout style={{ flex: 1 }} />
                </View>
              </View>
            ) : isLoading && comparedCars.length === 0 ? (
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
                          {formatVndPrice(car.price, undefined, {
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
  modeSwitcher: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.full,
    padding: 3,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: radii.full,
    gap: 4,
  },
  modeBtnActive: {
    backgroundColor: colors.primary,
  },
  modeBtnText: {
    color: colors.textSecondary,
    fontSize: 11.5,
    fontWeight: typography.weights.medium,
  },
  modeBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: typography.weights.semibold,
  },
  battleContainer: {
    marginVertical: spacing.xs,
  },
  battleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    marginVertical: spacing.sm,
  },
  battleCarCard: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.lg,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    position: 'relative',
  },
  battleRemoveBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 2,
  },
  battleCarImg: {
    width: '100%',
    height: 90,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
  battleCarName: {
    color: colors.text,
    fontSize: 12,
    fontWeight: typography.weights.bold,
    marginTop: 6,
    minHeight: 30,
  },
  battleCarPrice: {
    color: colors.primaryHover,
    fontSize: 12.5,
    fontWeight: typography.weights.bold,
    marginTop: 2,
  },
  battleVsCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
    borderWidth: 2,
    borderColor: colors.background,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  battleVsText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: typography.weights.black,
    fontStyle: 'italic',
  },
  battleMatrixCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: spacing.md,
  },
  battleSpecRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  battleColLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  battleColCenter: {
    width: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  battleColRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  battleSpecLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: typography.weights.medium,
    marginTop: 2,
  },
  battleValText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: typography.weights.semibold,
  },
  winnerVal: {
    color: colors.success,
  },
  winnerBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radii.xs,
    marginTop: 2,
  },
  winnerBadgeText: {
    color: colors.success,
    fontSize: 8.5,
    fontWeight: typography.weights.semibold,
  },
  battleActionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
});
