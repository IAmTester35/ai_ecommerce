import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radii, spacing, typography } from '../../theme';
import { Car } from '../../types';

interface CarSpecTableProps {
  car: Car;
}

export const CarSpecTable: React.FC<CarSpecTableProps> = ({ car }) => {
  const specs = [
    { label: 'Hãng & Dòng Xe', value: `${car.make} ${car.model}` },
    { label: 'Năm Sản Xuất', value: `${car.year}` },
    { label: 'Công Suất Cực Đại', value: car.engine_hp ? `${car.engine_hp} Mã lực (HP)` : 'N/A' },
    { label: 'Mô-men xoắn cực đại', value: car.metadata?.torque || 'Đang cập nhật' },
    { label: 'Tăng tốc 0-100 km/h', value: car.metadata?.acceleration_0_100 || 'N/A' },
    { label: 'Tốc độ tối đa', value: car.metadata?.top_speed || 'N/A' },
    { label: 'Loại Động Cơ / Pin', value: car.metadata?.engine_fuel_type || car.metadata?.fuel_type || 'Đang cập nhật' },
    { label: 'Hộp Số', value: car.metadata?.transmission || 'Đang cập nhật' },
    { label: 'Kiểu Dáng Thân Xe', value: car.metadata?.body_type || 'Đang cập nhật' },
    { label: 'Số Chỗ Ngồi', value: car.metadata?.seating_capacity ? `${car.metadata.seating_capacity} chỗ` : 'Đang cập nhật' },
    { label: 'Mức Tiêu Thụ Nhiên Liệu', value: car.metadata?.fuel_economy || 'Đang cập nhật' },
    { label: 'Kích Thước (DxRxC)', value: car.metadata?.dimensions || 'Đang cập nhật' },
    { label: 'Số Túi Khí An Toàn', value: car.metadata?.airbags ? `${car.metadata.airbags} túi khí` : 'Đang cập nhật' },
    { label: 'Chính Sách Bảo Hành', value: car.metadata?.warranty || 'Đang cập nhật' },
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
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowDefault: {
    backgroundColor: colors.surface,
  },
  rowAlt: {
    backgroundColor: colors.surfaceElevated,
  },
  label: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.medium,
    flex: 1,
  },
  value: {
    color: colors.text,
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.bold,
    textAlign: 'right',
    flex: 1.2,
  },
});
