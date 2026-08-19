import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radii, spacing, typography, shadows } from '../../theme';
import { Car } from '../../types';

interface CarSpecTableProps {
  car: Car;
}

export const CarSpecTable: React.FC<CarSpecTableProps> = ({ car }) => {
  const specs = [
    { label: 'Hãng & Dòng xe', value: `${car.make} ${car.model}` },
    { label: 'Năm sản xuất', value: `${car.year}` },
    { label: 'Công suất cực đại', value: car.engine_hp ? `${car.engine_hp} HP` : 'N/A' },
    { label: 'Mô-men xoắn', value: car.metadata?.torque || 'Đang cập nhật' },
    { label: 'Tăng tốc 0-100 km/h', value: car.metadata?.acceleration_0_100 || 'N/A' },
    { label: 'Tốc độ tối đa', value: car.metadata?.top_speed || 'N/A' },
    { label: 'Động cơ / Nhiên liệu', value: car.metadata?.engine_fuel_type || car.metadata?.fuel_type || 'Đang cập nhật' },
    { label: 'Hộp số', value: car.metadata?.transmission || 'Đang cập nhật' },
    { label: 'Kiểu dáng', value: car.metadata?.body_type || 'Đang cập nhật' },
    { label: 'Số chỗ ngồi', value: car.metadata?.seating_capacity ? `${car.metadata.seating_capacity} chỗ` : 'Đang cập nhật' },
    { label: 'Mức tiêu thụ', value: car.metadata?.fuel_economy || 'Đang cập nhật' },
    { label: 'Kích thước', value: car.metadata?.dimensions || 'Đang cập nhật' },
    { label: 'Túi khí an toàn', value: car.metadata?.airbags ? `${car.metadata.airbags} túi khí` : 'Đang cập nhật' },
    { label: 'Bảo hành', value: car.metadata?.warranty || 'Đang cập nhật' },
  ];

  return (
    <View style={styles.table}>
      {specs.map((item, idx) => {
        const isAlt = idx % 2 === 1;
        return (
          <View
            key={item.label}
            style={[styles.row, isAlt ? styles.rowAlt : styles.rowDefault]}
          >
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.value}>{item.value}</Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  table: {
    backgroundColor: colors.cardBg,
    borderRadius: radii.lg,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
  },
  rowDefault: {
    backgroundColor: 'transparent',
  },
  rowAlt: {
    backgroundColor: 'rgba(255, 255, 255, 0.025)',
  },
  label: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.regular,
    flex: 1,
  },
  value: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    textAlign: 'right',
    flex: 1.2,
  },
});

