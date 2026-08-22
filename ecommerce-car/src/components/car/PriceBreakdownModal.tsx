import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '../../theme';
import { ModalSheet } from '../ui/ModalSheet';
import {
  CarSpecInput,
  calculateCarPriceBreakdown,
  calculateOnTheRoadPrice,
  formatVnd,
  formatUsd,
} from '../../utils/currency';

interface PriceBreakdownModalProps {
  visible: boolean;
  onClose: () => void;
  priceUsd?: number | null;
  carMake?: string;
  carModel?: string;
  spec?: CarSpecInput;
}

export const PriceBreakdownModal: React.FC<PriceBreakdownModalProps> = ({
  visible,
  onClose,
  priceUsd,
  carMake,
  carModel,
  spec,
}) => {
  const [selectedLocation, setSelectedLocation] = useState<'hanoi_hcm' | 'province'>('hanoi_hcm');

  const breakdown = calculateCarPriceBreakdown(priceUsd, spec);
  const onTheRoad = calculateOnTheRoadPrice(breakdown.listedPriceVnd, {
    location: selectedLocation,
    isEV: (spec?.fuelType || '').toLowerCase().includes('electric') || (spec?.fuelType || '').toLowerCase().includes('điện'),
    seatingCapacity: spec?.seatingCapacity || 5,
  });

  return (
    <ModalSheet
      visible={visible}
      onClose={onClose}
      title="Dự Toán Thuế & Lăn Bánh"
      subtitle={`${carMake || 'Xe'} ${carModel || ''} • Bóc tách chi phí chuẩn Việt Nam`}
    >
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        {/* Section 1: Base CIF */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="globe-outline" size={15} color={colors.primaryHover} />
            <Text style={styles.sectionTitle}>1. Giá Xuất Xưởng / CIF</Text>
          </View>
          <View style={styles.cardBox}>
            <View style={styles.row}>
              <Text style={styles.label}>Giá gốc tại nước ngoài (MSRP):</Text>
              <Text style={styles.value}>{formatUsd(breakdown.rawUsd)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Quy đổi tỷ giá CIF (25.400đ/$):</Text>
              <Text style={styles.valueHighlight}>{formatVnd(breakdown.baseCifVnd)}</Text>
            </View>
          </View>
        </View>

        {/* Section 2: Import & Production Taxes */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="receipt-outline" size={15} color={colors.primaryHover} />
            <Text style={styles.sectionTitle}>2. Thuế Nhập Khẩu & Tiêu Thụ</Text>
          </View>
          <View style={styles.cardBox}>
            <View style={styles.row}>
              <Text style={styles.label}>
                Thuế nhập khẩu ({(breakdown.importDutyRate * 100).toFixed(0)}%):
              </Text>
              <Text style={styles.value}>+{formatVnd(breakdown.importDutyAmount)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>
                Thuế TTĐB ({(breakdown.exciseTaxRate * 100).toFixed(0)}%):
              </Text>
              <Text style={styles.value}>+{formatVnd(breakdown.exciseTaxAmount)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>
                Thuế GTGT / VAT ({(breakdown.vatRate * 100).toFixed(0)}%):
              </Text>
              <Text style={styles.value}>+{formatVnd(breakdown.vatAmount)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>
                Phí phân phối & đại lý ({(breakdown.dealerMarginRate * 100).toFixed(0)}%):
              </Text>
              <Text style={styles.value}>+{formatVnd(breakdown.dealerMarginAmount)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.boldLabel}>Giá Niêm Yết:</Text>
              <Text style={styles.totalListedValue}>{formatVnd(breakdown.listedPriceVnd)}</Text>
            </View>
          </View>
        </View>

        {/* Section 3: On-The-Road Registration Fees */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="car-sport-outline" size={15} color={colors.primaryHover} />
            <Text style={styles.sectionTitle}>3. Chi Phí Lăn Bánh (Đăng Ký Biển Số)</Text>
          </View>

          {/* Location Picker */}
          <View style={styles.locationRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setSelectedLocation('hanoi_hcm')}
              style={[
                styles.locPill,
                selectedLocation === 'hanoi_hcm' ? styles.locPillActive : styles.locPillInactive,
              ]}
            >
              <Text
                style={[
                  styles.locPillText,
                  selectedLocation === 'hanoi_hcm' ? styles.locPillTextActive : styles.locPillTextInactive,
                ]}
              >
                Hà Nội & TP.HCM (Biển 20tr)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setSelectedLocation('province')}
              style={[
                styles.locPill,
                selectedLocation === 'province' ? styles.locPillActive : styles.locPillInactive,
              ]}
            >
              <Text
                style={[
                  styles.locPillText,
                  selectedLocation === 'province' ? styles.locPillTextActive : styles.locPillTextInactive,
                ]}
              >
                Các Tỉnh Khác (Biển 1tr)
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.cardBox}>
            <View style={styles.row}>
              <Text style={styles.label}>
                Lệ phí trước bạ ({(onTheRoad.registrationFeeRate * 100).toFixed(0)}%):
              </Text>
              <Text style={styles.value}>+{formatVnd(onTheRoad.registrationFee)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Phí cấp biển số:</Text>
              <Text style={styles.value}>+{formatVnd(onTheRoad.plateFee)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Phí đăng kiểm định kỳ:</Text>
              <Text style={styles.value}>+{formatVnd(onTheRoad.inspectionFee)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Phí sử dụng đường bộ (1 năm):</Text>
              <Text style={styles.value}>+{formatVnd(onTheRoad.roadMaintenanceFee)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Bảo hiểm TNDS bắt buộc (1 năm):</Text>
              <Text style={styles.value}>+{formatVnd(onTheRoad.mandatoryInsuranceFee)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.boldLabel}>Tổng Chi Phí Lăn Bánh:</Text>
              <Text style={styles.grandTotalValue}>{formatVnd(onTheRoad.totalOnTheRoadPrice)}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.note}>
          * Bảng tính mang tính chất tham khảo dự toán chi phí thực tế tại thị trường Việt Nam. Phí bảo hiểm thân vỏ tự nguyện (~1.5%) chưa bao gồm trong bảng tính.
        </Text>
      </ScrollView>
    </ModalSheet>
  );
};

const styles = StyleSheet.create({
  scroll: {
    maxHeight: 520,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.semibold,
  },
  cardBox: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 3,
  },
  label: {
    color: colors.textSecondary,
    fontSize: typography.sizes['2xs'],
  },
  value: {
    color: colors.text,
    fontSize: typography.sizes['2xs'],
    fontWeight: typography.weights.medium,
  },
  valueHighlight: {
    color: colors.primaryHover,
    fontSize: typography.sizes['2xs'],
    fontWeight: typography.weights.semibold,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: spacing.xs + 2,
  },
  boldLabel: {
    color: colors.text,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  totalListedValue: {
    color: colors.primaryHover,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  grandTotalValue: {
    color: '#10B981', // emerald green for final on-the-road
    fontSize: typography.sizes.sm + 1,
    fontWeight: typography.weights.bold,
  },
  locationRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.xs + 2,
  },
  locPill: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  locPillInactive: {
    backgroundColor: colors.surfaceElevated,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  locPillActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: 'rgba(59, 130, 246, 0.35)',
  },
  locPillText: {
    fontSize: typography.sizes['2xs'],
    fontWeight: typography.weights.medium,
  },
  locPillTextInactive: {
    color: colors.textSecondary,
  },
  locPillTextActive: {
    color: colors.primaryHover,
    fontWeight: typography.weights.semibold,
  },
  note: {
    color: colors.textMuted,
    fontSize: 10,
    fontStyle: 'italic',
    lineHeight: 14,
    marginBottom: spacing.lg,
    paddingHorizontal: 2,
  },
});
