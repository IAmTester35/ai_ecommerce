import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '../../theme';
import { useCarStore } from '../../store/useCarStore';
import { useCartStore } from '../../store/useCartStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ModalSheet } from '../../components/ui/ModalSheet';
import { formatVndPrice } from '../../components/ui/PriceTag';
import { CarResponse } from '../../types';
import { FALLBACK_CAR_URL } from '../../constants/images';

export default function CompareScreen() {
  const { topCars, fetchTopCars, isLoading } = useCarStore();
  const { addToCart } = useCartStore();
  const { user } = useAuthStore();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [highlightDifferences, setHighlightDifferences] = useState(true);

  useEffect(() => {
    fetchTopCars();
  }, [fetchTopCars]);

  const activeComparedIds = useMemo(() => {
    if (selectedIds.length > 0) return selectedIds;
    return topCars.slice(0, 2).map((c) => c.id);
  }, [selectedIds, topCars]);

  const comparedCars: CarResponse[] = useMemo(() => {
    return activeComparedIds
      .map((id) => topCars.find((c) => c.id === id))
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
  }, [activeComparedIds, topCars]);

  const removeCar = (carId: string) => {
    if (comparedCars.length <= 2) {
      Alert.alert('Thông báo', 'Cần tối thiểu 2 xe để hiển thị bảng so sánh.');
      return;
    }
    setSelectedIds(activeComparedIds.filter((id) => id !== carId));
  };

  const addCarToCompare = (carId: string) => {
    if (activeComparedIds.includes(carId)) {
      Alert.alert('Thông báo', 'Mẫu xe này đã có trong danh sách so sánh.');
      return;
    }
    if (activeComparedIds.length >= 4) {
      Alert.alert('Giới hạn', 'Bạn có thể so sánh tối đa 4 xe cùng lúc.');
      return;
    }
    setSelectedIds([...activeComparedIds, carId]);
    setIsAddModalVisible(false);
  };

  const handleAddToCart = async (carId: string) => {
    try {
      await addToCart(user?.id, carId, 1);
      Alert.alert('Thành công', 'Đã thêm xe vào danh sách đặt cọc.', [
        { text: 'Xem tiếp', style: 'cancel' },
        { text: 'Xem giỏ hàng', onPress: () => router.push('/cart' as any) },
      ]);
    } catch {
      Alert.alert('Lỗi', 'Không thể thêm vào giỏ hàng.');
    }
  };

  const fallbackImage = FALLBACK_CAR_URL;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Title */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.titleLeft}>
            <Ionicons name="git-compare-outline" size={16} color={colors.primaryHover} style={{ marginRight: 6 }} />
            <Text style={styles.title}>So Sánh Thông Số Xe</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.addCarBtn}
            onPress={() => setIsAddModalVisible(true)}
          >
            <Ionicons name="add" size={13} color="#FFFFFF" />
            <Text style={styles.addCarBtnText}>Thêm xe</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Comparison Options Bar */}
      <Card style={styles.aiSummaryCard} padding={spacing.sm}>
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
      </Card>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} size="small" style={{ marginVertical: 30 }} />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tableScroll}>
          <View style={styles.table}>
            {/* Header Row: Car Info & Actions */}
            <View style={styles.tableRow}>
              <View style={styles.labelCol}>
                <Text style={styles.tableHeaderLabel}>Mẫu xe</Text>
              </View>
              {comparedCars.map((car) => (
                <View key={car.id} style={styles.carCol}>
                  <TouchableOpacity
                    style={styles.closeBtn}
                    onPress={() => removeCar(car.id)}
                  >
                    <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => router.push(`/car/${car.id}` as any)}
                  >
                    <Image
                      source={{ uri: car.image_url || fallbackImage }}
                      style={styles.thumbImage}
                      contentFit="cover"
                    />
                    <Text style={styles.carName} numberOfLines={2}>
                      {car.make} {car.model}
                    </Text>
                  </TouchableOpacity>

                  <Text style={styles.metricValueSmall}>Năm {car.year}</Text>

                  <Button
                    title="Đặt cọc"
                    size="sm"
                    variant="primary"
                    onPress={() => handleAddToCart(car.id)}
                    style={styles.colActionBtn}
                  />
                </View>
              ))}
            </View>

            {/* Metric 1: Price */}
            <View style={[styles.tableRow, highlightDifferences && styles.diffRow]}>
              <View style={styles.labelCol}>
                <Text style={styles.metricLabel}>Giá Niêm Yết</Text>
              </View>
              {comparedCars.map((car) => (
                <View key={car.id} style={styles.carCol}>
                  <Text style={styles.metricValueHighlight}>{formatVndPrice(car.price)}</Text>
                </View>
              ))}
            </View>

            {/* Metric 2: Engine HP */}
            <View style={styles.tableRowAlt}>
              <View style={styles.labelCol}>
                <Text style={styles.metricLabel}>Công Suất</Text>
              </View>
              {comparedCars.map((car) => (
                <View key={car.id} style={styles.carCol}>
                  <Text style={styles.metricValue}>
                    {car.engine_hp ? `${car.engine_hp} HP` : 'N/A'}
                  </Text>
                </View>
              ))}
            </View>

            {/* Metric 3: Torque */}
            <View style={styles.tableRow}>
              <View style={styles.labelCol}>
                <Text style={styles.metricLabel}>Mô-men xoắn</Text>
              </View>
              {comparedCars.map((car) => (
                <View key={car.id} style={styles.carCol}>
                  <Text style={styles.metricValueSmall}>
                    {car.metadata?.torque || 'Đang cập nhật'}
                  </Text>
                </View>
              ))}
            </View>

            {/* Metric 4: 0-100 km/h */}
            <View style={styles.tableRowAlt}>
              <View style={styles.labelCol}>
                <Text style={styles.metricLabel}>Tăng tốc 0-100</Text>
              </View>
              {comparedCars.map((car) => (
                <View key={car.id} style={styles.carCol}>
                  <Text style={styles.metricValueSmall}>
                    {car.metadata?.acceleration_0_100 || 'N/A'}
                  </Text>
                </View>
              ))}
            </View>

            {/* Metric 5: Fuel Type */}
            <View style={styles.tableRow}>
              <View style={styles.labelCol}>
                <Text style={styles.metricLabel}>Nhiên Liệu</Text>
              </View>
              {comparedCars.map((car) => (
                <View key={car.id} style={styles.carCol}>
                  <Text style={styles.metricValueSmall}>
                    {car.metadata?.fuel_type || 'Xăng'}
                  </Text>
                </View>
              ))}
            </View>

            {/* Metric 6: Transmission */}
            <View style={styles.tableRowAlt}>
              <View style={styles.labelCol}>
                <Text style={styles.metricLabel}>Hộp Số</Text>
              </View>
              {comparedCars.map((car) => (
                <View key={car.id} style={styles.carCol}>
                  <Text style={styles.metricValueSmall}>
                    {car.metadata?.transmission || 'Tự động'}
                  </Text>
                </View>
              ))}
            </View>

            {/* Metric 7: Seats */}
            <View style={styles.tableRow}>
              <View style={styles.labelCol}>
                <Text style={styles.metricLabel}>Số Chỗ Ngồi</Text>
              </View>
              {comparedCars.map((car) => (
                <View key={car.id} style={styles.carCol}>
                  <Text style={styles.metricValueSmall}>
                    {car.metadata?.seating_capacity ? `${car.metadata.seating_capacity} chỗ` : '5 chỗ'}
                  </Text>
                </View>
              ))}
            </View>

            {/* Metric 8: Fuel Economy */}
            <View style={styles.tableRowAlt}>
              <View style={styles.labelCol}>
                <Text style={styles.metricLabel}>Mức Tiêu Thụ</Text>
              </View>
              {comparedCars.map((car) => (
                <View key={car.id} style={styles.carCol}>
                  <Text style={styles.metricValueSmall}>
                    {car.metadata?.fuel_economy || 'N/A'}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      )}

      {/* Add Car Modal */}
      <ModalSheet
        visible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
        title="Thêm Xe So Sánh"
        subtitle="Chọn mẫu xe từ kho showroom"
      >
        <ScrollView style={{ maxHeight: 360 }}>
          {topCars
            .filter((c) => !activeComparedIds.includes(c.id))
            .map((c) => (
              <TouchableOpacity
                key={c.id}
                activeOpacity={0.8}
                style={styles.addCarItem}
                onPress={() => addCarToCompare(c.id)}
              >
                <Image source={{ uri: c.image_url || fallbackImage }} style={styles.addCarThumb} />
                <View style={styles.addCarInfo}>
                  <Text style={styles.addCarTitle}>{c.make} {c.model} ({c.year})</Text>
                  <Text style={styles.addCarPrice}>{formatVndPrice(c.price)}</Text>
                </View>
                <Ionicons name="add-circle" size={18} color={colors.primaryHover} />
              </TouchableOpacity>
            ))}
        </ScrollView>
      </ModalSheet>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
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
    paddingVertical: 5,
    borderRadius: radii.full,
    gap: 3,
  },
  addCarBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: typography.weights.semibold,
  },
  aiSummaryCard: {
    marginBottom: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
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
    width: 100,
    paddingHorizontal: spacing.sm + 2,
  },
  tableHeaderLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: typography.weights.medium,
  },
  carCol: {
    width: 140,
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
    width: 115,
    height: 70,
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
  addCarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.sm,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  addCarThumb: {
    width: 50,
    height: 35,
    borderRadius: radii.xs,
    marginRight: spacing.sm,
  },
  addCarInfo: {
    flex: 1,
  },
  addCarTitle: {
    color: colors.text,
    fontSize: 11,
    fontWeight: typography.weights.semibold,
  },
  addCarPrice: {
    color: colors.primaryHover,
    fontSize: 11,
    fontWeight: typography.weights.bold,
    marginTop: 1,
  },
});
