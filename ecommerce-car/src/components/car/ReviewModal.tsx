import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { ModalSheet } from '../ui/ModalSheet';
import { RatingStars } from '../ui/RatingStars';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface ReviewModalProps {
  visible: boolean;
  onClose: () => void;
  carName: string;
  onSubmitReview: (rating: number, comment: string, authorName: string) => Promise<void>;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  visible,
  onClose,
  carName,
  onSubmitReview,
}) => {
  const [rating, setRating] = useState(5);
  const [authorName, setAuthorName] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!comment.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập cảm nhận đánh giá của bạn.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitReview(rating, comment.trim(), authorName.trim() || 'Khách Hàng AutoMatch');
      Alert.alert('Gửi Thành Công', 'Cảm ơn bạn đã gửi đánh giá quý báu cho cộng đồng AutoMatch.');
      setComment('');
      onClose();
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể gửi đánh giá lúc này.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalSheet
      visible={visible}
      onClose={onClose}
      title="Đánh Giá & Nhận Xét"
      subtitle={`Chia sẻ trải nghiệm về ${carName}`}
    >
      <View style={styles.content}>
        <Text style={styles.label}>Mức độ hài lòng</Text>
        <View style={styles.ratingRow}>
          <RatingStars
            rating={rating}
            size={22}
            interactive
            onRatingChange={setRating}
          />
          <Text style={styles.ratingScore}>{rating}/5 Sao</Text>
        </View>

        <Input
          label="Họ và Tên"
          placeholder="Ví dụ: Nguyễn Văn A"
          value={authorName}
          onChangeText={setAuthorName}
        />

        <Input
          label="Nhận xét chi tiết *"
          placeholder="Cảm giác lái, nội thất, mức tiêu hao nhiên liệu..."
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={4}
          inputStyle={styles.textArea}
          required
        />

        <Button
          title="Gửi Đánh Giá"
          variant="primary"
          loading={isSubmitting}
          disabled={isSubmitting}
          onPress={handleSubmit}
          fullWidth
          style={styles.submitBtn}
        />
      </View>
    </ModalSheet>
  );
};

const styles = StyleSheet.create({
  content: {
    gap: spacing.xs + 2,
  },
  label: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  ratingScore: {
    color: colors.conflict,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  submitBtn: {
    marginTop: spacing.xs,
  },
});

