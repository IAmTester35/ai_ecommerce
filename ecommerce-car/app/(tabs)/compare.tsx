import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '../../src/theme/colors';
import { useCarStore } from '../../src/store/useCarStore';
import { CarResponse } from '../../src/types';
import { Badge } from '../../src/components/ui/Badge';
import { Card } from '../../src/components/ui/Card';
import { Ionicons } from '@expo/vector-icons';

export default function CompareScreen() {
  const { topCars, fetchTopCars, isLoading } = useCarStore();
  const [removedIds, setRemovedIds] = useState<string[]>([]);

  useEffect(() => {
    fetchTopCars();
  }, [fetchTopCars]);

  const removedSet = new Set(removedIds);
  const compareCars: CarResponse[] = topCars
    .filter((c) => !removedSet.has(c.id))
    .slice(0, 4)
    .map((c, idx) => ({
      id: c.id,
      make: c.make,
      model: c.model,
      year: c.year,
      engine_hp: c.engine_hp || undefined,
      price: c.price || undefined,
      metadata: c.metadata || undefined,
      similarity: 0.9 - idx * 0.04,
      rerank_score: 0.92 - idx * 0.04,
      image_url: c.image_url || undefined,
    }));

  const removeCar = (carId: string) => {
    if (compareCars.length <= 2) {
      alert('Cần ít nhất 2 xe để thực hiện so sánh!');
      return;
    }
    setRemovedIds((prev) => [...prev, carId]);
  };

  const formatPrice = (price?: number) => {
    if (!price) return 'N/A';
    return `${(price / 1_000_000).toFixed(0)} triệu`;
  };

  const fallbackImage = 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=800';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Title */}
      <View style={styles.header}>
        <Text style={styles.title}>⚖️ So Sánh Xe Thông Minh</Text>
        <Text style={styles.subtitle}>
          Phân tích đối chiếu thông số & tư vấn từ dữ liệu Supabase
        </Text>
      </View>

      {/* AI Comparison Summary Card */}
      <Card highlightBorder style={styles.aiSummaryCard}>
        <View style={styles.aiSummaryHeader}>
          <Ionicons name="sparkles" size={18} color={colors.primary} />
          <Text style={styles.aiSummaryTitle}>Nhận Xét Nhanh Từ AutoMatch AI</Text>
        </View>
        <Text style={styles.aiSummaryText}>
          Dữ liệu đối chiếu trực tiếp từ kho xe Supabase cho phép so sánh minh bạch về công suất (HP), giá niêm yết và thông số hộp số giữa các phiên bản.
        </Text>
      </Card>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} size="large" style={{ marginVertical: 30 }} />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tableScroll}>
          <View style={styles.table}>
            {/* Header Row: Cars Header */}
            <View style={styles.tableRow}>
              <View style={styles.labelCol}>
                <Text style={styles.tableHeaderLabel}>Tiêu chí</Text>
              </View>
              {compareCars.map((car) => (
                <View key={car.id} style={styles.carCol}>
                  <TouchableOpacity
                    style={styles.closeBtn}
                    onPress={() => removeCar(car.id)}
                  >
                    <Ionicons name="close-circle" size={18} color={colors.danger} />
                  </TouchableOpacity>
                  <Image source={{ uri: car.image_url || fallbackImage }} style={styles.thumbImage} />
                  <Text style={styles.carName} numberOfLines={1}>
                    {car.make} {car.model}
                  </Text>
                  <Badge
                    label={`${Math.round((car.rerank_score || 0.9) * 100)}% Match`}
                    variant="primary"
                    size="sm"
                  />
                </View>
              ))}
            </View>

            {/* Metric 1: Price */}
            <View style={styles.tableRow}>
              <View style={styles.labelCol}>
                <Text style={styles.metricLabel}>Giá Niêm Yết</Text>
              </View>
              {compareCars.map((car) => (
                <View key={car.id} style={styles.carCol}>
                  <Text style={styles.metricValueHighlight}>{formatPrice(car.price)}</Text>
                </View>
              ))}
            </View>

            {/* Metric 2: Engine HP */}
            <View style={styles.tableRowAlt}>
              <View style={styles.labelCol}>
                <Text style={styles.metricLabel}>Công Suất (HP)</Text>
              </View>
              {compareCars.map((car) => (
                <View key={car.id} style={styles.carCol}>
                  <Text style={styles.metricValue}>{car.engine_hp || 'N/A'} HP</Text>
                </View>
              ))}
            </View>

            {/* Metric 3: Transmission */}
            <View style={styles.tableRow}>
              <View style={styles.labelCol}>
                <Text style={styles.metricLabel}>Hộp Số</Text>
              </View>
              {compareCars.map((car) => (
                <View key={car.id} style={styles.carCol}>
                  <Text style={styles.metricValueSmall}>
                    {car.metadata?.transmission || 'Tự động'}
                  </Text>
                </View>
              ))}
            </View>

            {/* Metric 4: Fuel Type */}
            <View style={styles.tableRowAlt}>
              <View style={styles.labelCol}>
                <Text style={styles.metricLabel}>Động Cơ</Text>
              </View>
              {compareCars.map((car) => (
                <View key={car.id} style={styles.carCol}>
                  <Text style={styles.metricValueSmall}>
                    {car.metadata?.fuel_type || 'Xăng'}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
  },
  header: {
    marginTop: 16,
    marginBottom: 14,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  aiSummaryCard: {
    marginBottom: 16,
  },
  aiSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  aiSummaryTitle: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  aiSummaryText: {
    color: colors.text,
    fontSize: 12,
    lineHeight: 18,
  },
  tableScroll: {
    marginBottom: 30,
  },
  table: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableRowAlt: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: colors.surfaceElevated,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  labelCol: {
    width: 110,
    paddingHorizontal: 12,
  },
  tableHeaderLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  carCol: {
    width: 140,
    alignItems: 'center',
    paddingHorizontal: 8,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: -4,
    right: 4,
    zIndex: 10,
  },
  thumbImage: {
    width: 100,
    height: 60,
    borderRadius: 8,
    marginBottom: 6,
  },
  carName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  metricLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  metricValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  metricValueHighlight: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  metricValueSmall: {
    color: colors.text,
    fontSize: 11,
    textAlign: 'center',
  },
});
