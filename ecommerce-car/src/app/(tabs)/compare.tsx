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
import { colors, radii, spacing, typography, shadows } from '../../theme';
import { useCarStore } from '../../store/useCarStore';
import { useCartStore } from '../../store/useCartStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ModalSheet } from '../../components/ui/ModalSheet';
import { formatVndPrice } from '../../components/ui/PriceTag';
import { CarResponse } from '../../types';

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
      .map((c, idx) => ({
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
      Alert.alert('Thông báo', 'Cần ít nhất 2 xe để duy trì bảng so sánh đối chiếu.');
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
      Alert.alert('Giới hạn', 'Bạn chỉ có thể so sánh tối đa 4 xe cùng lúc.');
      return;
    }
    setSelectedIds([...activeComparedIds, carId]);
    setIsAddModalVisible(false);
  };

  const handleAddToCart = async (carId: string) => {
    try {
      await addToCart(user?.id, carId, 1);
      Alert.alert('Thành Công! 🛒', 'Đã thêm xe vào giỏ hàng đặt cọc.', [
        { text: 'Xem tiếp', style: 'cancel' },
        { text: 'Đến giỏ hàng', onPress: () => router.push('/cart' as any) },
      ]);
    } catch {
      Alert.alert('Lỗi', 'Không thể thêm vào giỏ hàng.');
    }
  };

  const fallbackImage =
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=800';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Title */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>⚖️ So Sánh Thông Số Đối Chiếu</Text>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.addCarBtn}
            onPress={() => setIsAddModalVisible(true)}
          >
            <Ionicons name="add" size={16} color={colors.textDark} />
            <Text style={styles.addCarBtnText}>Thêm xe</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>
          Phân tích kỹ thuật chi tiết từ cơ sở dữ liệu showroom AutoMatch
        </Text>
      </View>

      {/* Comparison Options Bar */}
      <Card style={styles.aiSummaryCard}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setHighlightDifferences(!highlightDifferences)}
          style={styles.toggleDiffRow}
        >
          <Ionicons
            name={highlightDifferences ? 'checkbox' : 'square-outline'}
            size={18}
            color={colors.primary}
          />
          <Text style={styles.toggleDiffText}>Làm nổi bật các thông số khác biệt giữa các dòng xe</Text>
        </TouchableOpacity>
      </Card>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} size="large" style={{ marginVertical: 30 }} />
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
                    <Ionicons name="close-circle" size={20} color={colors.danger} />
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
        title="Thêm Xe Vào Bảng So Sánh"
        subtitle="Chọn mẫu xe từ cơ sở dữ liệu Supabase"
      >
        <ScrollView style={{ maxHeight: 400 }}>
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
                <Ionicons name="add-circle" size={24} color={colors.primary} />
              </TouchableOpacity>
            ))}
        </ScrollView>
      </ModalSheet>

      <View style={{ height: 40 }} />
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
    marginTop: 52,
    marginBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: colors.text,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.extrabold,
    letterSpacing: -0.3,
  },
  addCarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: radii.sm,
    gap: 4,
  },
  addCarBtnText: {
    color: colors.textDark,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    marginTop: 4,
  },
  aiSummaryCard: {
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  aiSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    marginBottom: spacing.xs,
  },
  aiSummaryTitle: {
    color: colors.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  aiSummaryText: {
    color: colors.text,
    fontSize: typography.sizes.xs + 1,
    lineHeight: 18,
  },
  toggleDiffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    marginTop: spacing.sm,
    paddingTop: spacing.xs + 2,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  toggleDiffText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  tableScroll: {
    marginBottom: spacing['2xl'],
  },
  table: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableRowAlt: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceElevated,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  diffRow: {
    backgroundColor: 'rgba(0, 229, 255, 0.05)',
  },
  labelCol: {
    width: 115,
    paddingHorizontal: spacing.md,
  },
  tableHeaderLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  carCol: {
    width: 155,
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: -6,
    right: 6,
    zIndex: 10,
  },
  thumbImage: {
    width: 120,
    height: 70,
    borderRadius: radii.md,
    marginBottom: 6,
  },
  carName: {
    color: colors.text,
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
    height: 34,
  },
  colActionBtn: {
    width: '100%',
    height: 32,
  },
  metricLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  metricValue: {
    color: colors.text,
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.bold,
  },
  metricValueHighlight: {
    color: colors.primary,
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.extrabold,
  },
  metricValueSmall: {
    color: colors.text,
    fontSize: typography.sizes.xs,
    textAlign: 'center',
  },
  addCarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    marginBottom: spacing.xs + 2,
  },
  addCarThumb: {
    width: 60,
    height: 40,
    borderRadius: radii.xs,
    marginRight: spacing.md,
  },
  addCarInfo: {
    flex: 1,
  },
  addCarTitle: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  addCarPrice: {
    color: colors.primary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    marginTop: 2,
  },
});
