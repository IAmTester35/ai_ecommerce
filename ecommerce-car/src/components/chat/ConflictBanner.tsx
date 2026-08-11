import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { Badge } from '../ui/Badge';

interface ConflictBannerProps {
  relaxedTerms?: string[];
  message?: string;
}

export const ConflictBanner: React.FC<ConflictBannerProps> = ({ relaxedTerms = [], message }) => {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Badge label="AI Constraint Relaxation" variant="conflict" size="sm" />
        <Text style={styles.title}>Cảnh báo mâu thuẫn yêu cầu</Text>
      </View>
      <Text style={styles.body}>
        {message || 'Ràng buộc ban đầu chứa mâu thuẫn logic. AutoMatch AI đã tự động nới lỏng các tiêu chí bên dưới để tìm kiếm các lựa chọn tối ưu nhất cho bạn:'}
      </Text>
      {relaxedTerms.length > 0 && (
        <View style={styles.termsRow}>
          {relaxedTerms.map((term) => (
            <View key={term} style={styles.termChip}>
              <Text style={styles.termText}>• {term}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.conflictMuted,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.conflict,
    padding: 14,
    marginVertical: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  title: {
    color: colors.conflict,
    fontSize: 13,
    fontWeight: '700',
  },
  body: {
    color: colors.text,
    fontSize: 12,
    lineHeight: 18,
  },
  termsRow: {
    marginTop: 8,
    gap: 4,
  },
  termChip: {
    backgroundColor: 'rgba(255, 171, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  termText: {
    color: colors.conflict,
    fontSize: 11,
    fontWeight: '500',
  },
});
