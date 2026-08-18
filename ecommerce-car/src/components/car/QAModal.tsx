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
        'Đã Tiếp Nhận Câu Hỏi! 💬',
        'AutoMatch đã gửi câu hỏi tới các chuyên gia và tư vấn viên. Câu trả lời sẽ hiển thị trong ít phút.'
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
      title="Đặt Câu Hỏi Về Xe"
      subtitle={`Hỏi chuyên gia AutoMatch về mẫu xe ${carName}`}
    >
      <View style={styles.content}>
        <Input
          label="Nội dung câu hỏi của bạn *"
          placeholder="Ví dụ: Xe có hỗ trợ giao tận nhà không? Mức tiêu thụ thực tế khi chạy phố là bao nhiêu?..."
          value={question}
          onChangeText={setQuestion}
          multiline
          numberOfLines={4}
          inputStyle={styles.textArea}
          required
        />

        <Button
          title="Gửi Câu Hỏi Cho Chuyên Gia"
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
  },
  submitBtn: {
    marginTop: spacing.xs,
  },
});
