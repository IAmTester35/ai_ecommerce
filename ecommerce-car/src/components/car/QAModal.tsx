import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { spacing } from '../../theme';
import { ModalSheet } from '../ui/ModalSheet';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface QAModalProps {
  visible: boolean;
  onClose: () => void;
  carName: string;
  onSubmitQuestion: (question: string) => Promise<void>;
}

export const QAModal: React.FC<QAModalProps> = ({
  visible,
  onClose,
  carName,
  onSubmitQuestion,
}) => {
  const [question, setQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!question.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập câu hỏi cần tư vấn.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitQuestion(question.trim());
      Alert.alert(
        'Đã Tiếp Nhận',
        'AutoMatch đã gửi câu hỏi tới đội ngũ chuyên gia. Phản hồi sẽ hiển thị trong mục Hỏi đáp.'
      );
      setQuestion('');
      onClose();
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể gửi câu hỏi lúc này.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalSheet
      visible={visible}
      onClose={onClose}
      title="Hỏi Đáp Về Xe"
      subtitle={`Đặt câu hỏi về ${carName}`}
    >
      <View style={styles.content}>
        <Input
          label="Nội dung câu hỏi *"
          placeholder="Ví dụ: Gói bảo hành, chi phí bảo dưỡng định kỳ..."
          value={question}
          onChangeText={setQuestion}
          multiline
          numberOfLines={4}
          inputStyle={styles.textArea}
          required
        />

        <Button
          title="Gửi Câu Hỏi"
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
    gap: spacing.md,
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
    lineHeight: 20,
  },
  submitBtn: {
    marginTop: spacing.md,
  },
});

