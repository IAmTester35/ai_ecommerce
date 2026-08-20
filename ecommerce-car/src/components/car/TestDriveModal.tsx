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
import { Car } from '../../types';
import { ModalSheet } from '../ui/ModalSheet';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { globalAlert } from '../../store/useDialogStore';

interface TestDriveModalProps {
  visible: boolean;
  onClose: () => void;
  car: Car | null;
  onSubmitBooking: (
    scheduledAt: string,
    notes: string
  ) => Promise<void>;
}

const TIME_SLOTS = ['09:00', '10:30', '14:00', '16:00', '18:00'];

export const TestDriveModal: React.FC<TestDriveModalProps> = ({
  visible,
  onClose,
  car,
  onSubmitBooking,
}) => {
  const [selectedDayOffset, setSelectedDayOffset] = useState<number>(1); // 1 = tomorrow, 2 = day after
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>(TIME_SLOTS[0]);
  const [phone, setPhone] = useState('');
  const [locationNote, setLocationNote] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!car) return null;

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
    setIsSubmitting(true);
    try {
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + selectedDayOffset);
      const [hours, minutes] = selectedTimeSlot.split(':').map(Number);
      scheduledDate.setHours(hours, minutes, 0, 0);

      const notesParts: string[] = [];
      if (phone.trim()) {
        notesParts.push(`SĐT: ${phone.trim()}`);
      }
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
      globalAlert(
        'Đặt Lịch Thành Công',
        `Lịch trải nghiệm xe ${car.make} ${car.model} vào ${getTargetDateStr(selectedDayOffset)} (${selectedTimeSlot}) đã được ghi nhận.`
      );
      onClose();
    } catch (err: any) {
      globalAlert('Lỗi đặt lịch', err?.message || 'Không thể đăng ký lúc này.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalSheet
      visible={visible}
      onClose={onClose}
      title="Đăng Ký Lái Thử"
      subtitle={car ? `${car.make} ${car.model}` : 'Chọn lịch lái thử'}
    >
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        {/* Date Selector */}
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="calendar-outline" size={13} color={colors.primaryHover} />
          <Text style={styles.sectionTitle}>1. Chọn ngày</Text>
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
        <View style={[styles.sectionHeaderRow, { marginTop: spacing.sm }]}>
          <Ionicons name="time-outline" size={13} color={colors.primaryHover} />
          <Text style={styles.sectionTitle}>2. Khung giờ</Text>
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
          placeholder="Showroom Quận 1 hoặc tại nhà..."
          value={locationNote}
          onChangeText={setLocationNote}
          containerStyle={{ marginTop: spacing.sm }}
        />

        {/* Special Notes */}
        <Input
          label="Ghi chú (Tùy chọn)"
          placeholder="Tư vấn màu xe, bảo hiểm..."
          value={notes}
          onChangeText={setNotes}
          containerStyle={{ marginTop: spacing.xs }}
        />
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Xác Nhận Đăng Ký"
          variant="primary"
          size="sm"
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
    maxHeight: 420,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    lineHeight: 18,
  },
  dateRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  dateBox: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  dateBoxInactive: {
    backgroundColor: colors.surfaceElevated,
  },
  dateBoxActive: {
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    borderColor: 'rgba(59, 130, 246, 0.4)',
  },
  dateText: {
    fontSize: 11,
    fontWeight: typography.weights.medium,
  },
  dateTextInactive: {
    color: colors.textSecondary,
  },
  dateTextActive: {
    color: colors.primaryHover,
    fontWeight: typography.weights.semibold,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  timeSlot: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: radii.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  timeSlotInactive: {
    backgroundColor: colors.surfaceElevated,
  },
  timeSlotActive: {
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    borderColor: 'rgba(59, 130, 246, 0.4)',
  },
  timeSlotText: {
    fontSize: 10,
    fontWeight: typography.weights.medium,
  },
  timeSlotTextInactive: {
    color: colors.textSecondary,
  },
  timeSlotTextActive: {
    color: colors.primaryHover,
    fontWeight: typography.weights.semibold,
  },
  footer: {
    marginTop: spacing.md,
    paddingTop: spacing.xs,
  },
});

