import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '../../theme';
import { Car } from '../../types';
import { ModalSheet } from '../ui/ModalSheet';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface TestDriveModalProps {
  visible: boolean;
  onClose: () => void;
  car: Car | null;
  onSubmitBooking: (
    scheduledDate: string,
    notes?: string
  ) => Promise<void>;
}

const TIME_SLOTS = ['09:00 - 10:30', '10:30 - 12:00', '14:00 - 15:30', '16:00 - 17:30', '18:00 - 19:30'];

export const TestDriveModal: React.FC<TestDriveModalProps> = ({
  visible,
  onClose,
  car,
  onSubmitBooking,
}) => {
  const [selectedDayOffset, setSelectedDayOffset] = useState<number>(1); // 1 = tomorrow, 2 = day after
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>(TIME_SLOTS[0]);
  const [locationNote, setLocationNote] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getTargetDateStr = (dayOffset: number): string => {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    return d.toLocaleDateString('vi-VN', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
    });
  };

  const handleConfirm = async () => {
    if (!car) return;

    setIsSubmitting(true);
    try {
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + selectedDayOffset);

      const notesParts: string[] = [`Khung giờ: ${selectedTimeSlot}`];
      if (locationNote.trim()) {
        notesParts.push(`Địa điểm: ${locationNote.trim()}`);
      }
      if (notes.trim()) {
        notesParts.push(`Ghi chú: ${notes.trim()}`);
      }

      await onSubmitBooking(
        scheduledDate.toISOString(),
        notesParts.join(' | ')
      );
      Alert.alert(
        'Đặt Lịch Thành Công',
        `Lịch trải nghiệm xe ${car.make} ${car.model} vào ${getTargetDateStr(selectedDayOffset)} (${selectedTimeSlot}) đã được ghi nhận.`
      );
      onClose();
    } catch (err: any) {
      Alert.alert('Lỗi đặt lịch', err?.message || 'Không thể đăng ký lúc này.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalSheet
      visible={visible}
      onClose={onClose}
      title="Đăng Ký Lái Thử"
      subtitle={car ? `Trải nghiệm xe ${car.make} ${car.model}` : 'Chọn lịch lái thử'}
    >
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        {/* Date Selector */}
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="calendar-outline" size={14} color={colors.primaryHover} />
          <Text style={styles.sectionTitle}>1. Chọn ngày trải nghiệm</Text>
        </View>
        <View style={styles.dateRow}>
          {[1, 2, 3, 4].map((offset) => (
            <TouchableOpacity
              key={offset}
              activeOpacity={0.8}
              onPress={() => setSelectedDayOffset(offset)}
              style={[
                styles.dateBox,
                selectedDayOffset === offset ? styles.dateBoxActive : styles.dateBoxInactive,
              ]}
            >
              <Text
                style={[
                  styles.dateText,
                  selectedDayOffset === offset ? styles.dateTextActive : styles.dateTextInactive,
                ]}
              >
                {getTargetDateStr(offset)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Time Slot */}
        <View style={[styles.sectionHeaderRow, { marginTop: spacing.md }]}>
          <Ionicons name="time-outline" size={14} color={colors.primaryHover} />
          <Text style={styles.sectionTitle}>2. Khung giờ thuận tiện</Text>
        </View>
        <View style={styles.timeGrid}>
          {TIME_SLOTS.map((slot) => (
            <TouchableOpacity
              key={slot}
              activeOpacity={0.8}
              onPress={() => setSelectedTimeSlot(slot)}
              style={[
                styles.timeSlot,
                selectedTimeSlot === slot ? styles.timeSlotActive : styles.timeSlotInactive,
              ]}
            >
              <Text
                style={[
                  styles.timeSlotText,
                  selectedTimeSlot === slot ? styles.timeSlotTextActive : styles.timeSlotTextInactive,
                ]}
              >
                {slot}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Location & Preferred Address */}
        <Input
          label="Địa điểm mong muốn (Tùy chọn)"
          placeholder="Ví dụ: Showroom Quận 1 hoặc tận nơi..."
          value={locationNote}
          onChangeText={setLocationNote}
          containerStyle={{ marginTop: spacing.md }}
        />

        {/* Special Notes */}
        <Input
          label="Ghi chú thêm (Tùy chọn)"
          placeholder="Ví dụ: Tư vấn màu xe, bảo hiểm..."
          value={notes}
          onChangeText={setNotes}
          containerStyle={{ marginTop: spacing.xs }}
        />
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Xác Nhận Đăng Ký"
          variant="primary"
          loading={isSubmitting}
          disabled={isSubmitting}
          onPress={handleConfirm}
          fullWidth
        />
      </View>
    </ModalSheet>
  );
};

const styles = StyleSheet.create({
  scroll: {
    maxHeight: 440,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.semibold,
  },
  dateRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  dateBox: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: radii.xs,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateBoxInactive: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
  },
  dateBoxActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  dateText: {
    fontSize: typography.sizes['2xs'] + 1,
    fontWeight: typography.weights.semibold,
  },
  dateTextInactive: {
    color: colors.textSecondary,
  },
  dateTextActive: {
    color: colors.primaryHover,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  timeSlot: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.xs,
    borderWidth: 1,
  },
  timeSlotInactive: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
  },
  timeSlotActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  timeSlotText: {
    fontSize: typography.sizes['2xs'] + 1,
    fontWeight: typography.weights.semibold,
  },
  timeSlotTextInactive: {
    color: colors.textSecondary,
  },
  timeSlotTextActive: {
    color: colors.primaryHover,
  },
  footer: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});

