import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { ModalSheet } from '../ui/ModalSheet';
import { RatingStars } from '../ui/RatingStars';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { globalAlert } from '../../store/useDialogStore';

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
      globalAlert('Thiếu thông tin', 'Vui lòng nhập cảm nhận đánh giá của bạn.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitReview(rating, comment.trim(), authorName.trim() || 'Khách Hàng AutoMatch');
      globalAlert('Gửi Thành Công', 'Cảm ơn bạn đã gửi đánh giá quý báu cho cộng đồng AutoMatch.');
      setComment('');
      onClose();
    } catch (err: any) {
      globalAlert('Lỗi', err.message || 'Không thể gửi đánh giá lúc này.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalSheet
      visible={visible}
      onClose={onClose}
      title="Đánh Giá & Nhận Xét"
      subtitle={carName}
    >
      <View style={styles.content}>
        <Text style={styles.label}>Mức độ hài lòng</Text>
        <View style={styles.ratingRow}>
          <RatingStars
            rating={rating}
            size={18}
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
          placeholder="Cảm giác lái, nội thất, mức tiêu hao..."
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={3}
          inputStyle={styles.textArea}
          required
        />

        <Button
          title="Gửi Đánh Giá"
          variant="primary"
          size="sm"
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
    gap: spacing.sm,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: typography.weights.medium,
    lineHeight: 16,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: 2,
  },
  ratingScore: {
    color: colors.conflict,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
    lineHeight: 18,
  },
  submitBtn: {
    marginTop: spacing.sm,
  },
});

