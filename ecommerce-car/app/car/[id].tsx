import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { useCarStore } from '../../src/store/useCarStore';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useTestDriveStore } from '../../src/store/useTestDriveStore';
import { historyService } from '../../src/services/historyService';
import { Badge } from '../../src/components/ui/Badge';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { Ionicons } from '@expo/vector-icons';

export default function CarDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { selectedCar, fetchCarDetails, savedCars, toggleSaveCar, isLoading, error } = useCarStore();
  const { user } = useAuthStore();
  const { bookTestDrive } = useTestDriveStore();

  useEffect(() => {
    if (id) {
      fetchCarDetails(id);
      if (user?.id) {
        historyService.logViewedCar(user.id, id).catch(() => {});
      }
    }
  }, [id, fetchCarDetails, user]);

  const isSaved = savedCars.some((sc) => sc.car_id === id);

  const formatPrice = (price?: number | null) => {
    if (!price) return 'Liên hệ';
    if (price >= 1_000_000_000) {
      return `${(price / 1_000_000_000).toFixed(2)} tỷ VNĐ`;
    }
    return `${(price / 1_000_000).toFixed(0)} triệu VNĐ`;
  };

  const handleToggleSave = () => {
    if (!user?.id) {
      Alert.alert('Yêu cầu đăng nhập', 'Vui lòng đăng nhập để lưu xe vào danh sách yêu thích.');
      return;
    }
    if (id) {
      toggleSaveCar(id, user.id);
    }
  };

  const handleBookTestDrive = async () => {
    if (!user?.id || !id) {
      Alert.alert('Yêu cầu đăng nhập', 'Vui lòng đăng nhập để đặt lịch lái thử.');
      return;
    }

    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      await bookTestDrive(user.id, id, tomorrow.toISOString(), 'Đăng ký qua Mobile App');
      Alert.alert(
        'Đặt lịch lái thử thành công! 🚗',
        `Đã lên lịch trải nghiệm xe ${selectedCar?.make || ''} ${selectedCar?.model || ''}. Showroom sẽ xác nhận trong ít phút.`
      );
    } catch (err: any) {
      Alert.alert('Lỗi đặt lịch', err?.message || 'Không thể đăng ký lái thử lúc này.');
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (error || !selectedCar) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>{error || 'Không tìm thấy thông tin xe'}</Text>
      </View>
    );
  }

  const fallbackImage = 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=800';

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Main Hero Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: selectedCar.image_url || fallbackImage }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <TouchableOpacity style={styles.saveBtn} onPress={handleToggleSave}>
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={22}
              color={isSaved ? colors.primary : colors.text}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Header Info */}
          <View style={styles.titleRow}>
            <View>
              <Text style={styles.makeModel}>
                {selectedCar.make} {selectedCar.model}
              </Text>
              <Text style={styles.yearText}>Phiên bản năm {selectedCar.year}</Text>
            </View>
            <Badge label="AI Score: 94%" variant="primary" size="md" />
          </View>

          <Text style={styles.price}>{formatPrice(selectedCar.price)}</Text>

          {/* AI Fit Analysis Card */}
          <Card highlightBorder style={styles.aiCard}>
            <View style={styles.aiCardHeader}>
              <Ionicons name="sparkles" size={18} color={colors.primary} />
              <Text style={styles.aiCardTitle}>Đánh Giá Độ Phù Hợp (AutoMatch RAG)</Text>
            </View>
            <Text style={styles.aiCardText}>
              {selectedCar.metadata?.review ||
                'Mẫu xe này có cảm giác lái tốt, khung gầm vững chắc và chỉ số xếp hạng cao trong cơ sở dữ liệu xe Supabase.'}
            </Text>
          </Card>

          {/* Key Specs Grid */}
          <Text style={styles.sectionTitle}>⚙️ Thông Số Kỹ Thuật Chi Tiết</Text>
          <View style={styles.specGrid}>
            <View style={styles.specBox}>
              <Text style={styles.specLabel}>Công Suất</Text>
              <Text style={styles.specValue}>{selectedCar.engine_hp || 'N/A'} HP</Text>
            </View>
            <View style={styles.specBox}>
              <Text style={styles.specLabel}>Hộp Số</Text>
              <Text style={styles.specValue}>{selectedCar.metadata?.transmission || 'Tự động'}</Text>
            </View>
            <View style={styles.specBox}>
              <Text style={styles.specLabel}>Động Cơ</Text>
              <Text style={styles.specValue}>{selectedCar.metadata?.fuel_type || 'Xăng'}</Text>
            </View>
            <View style={styles.specBox}>
              <Text style={styles.specLabel}>Tồn Kho</Text>
              <Text style={styles.specValue}>{selectedCar.stock_quantity ?? 1} chiếc</Text>
            </View>
          </View>

          {/* Expert Review */}
          <Text style={styles.sectionTitle}>📝 Đánh Giá Chi Tiết</Text>
          <Card style={styles.reviewCard}>
            <Text style={styles.reviewText}>
              &quot;Dòng xe sở hữu thiết kế hiện đại, nội thất tiện nghi cùng khả năng vận hành êm ái trên mọi cung đường.&quot;
            </Text>
          </Card>
        </View>
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View style={styles.bottomBar}>
        <Button
          title="Tư vấn với AI"
          variant="outline"
          style={styles.actionBtnFlex}
          onPress={() => router.push('/(tabs)/ai-chat' as any)}
        />
        <Button
          title="Lái Thử Ngay"
          variant="primary"
          style={styles.actionBtnFlex}
          onPress={handleBookTestDrive}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
  },
  imageContainer: {
    height: 240,
    width: '100%',
    position: 'relative',
    backgroundColor: colors.surfaceElevated,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  saveBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(11, 14, 20, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  makeModel: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  yearText: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  price: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
  },
  aiCard: {
    marginBottom: 20,
    backgroundColor: 'rgba(0, 229, 255, 0.05)',
  },
  aiCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  aiCardTitle: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  aiCardText: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 19,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 8,
  },
  specGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  specBox: {
    width: '48%',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  specLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    marginBottom: 4,
  },
  specValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  reviewCard: {
    marginBottom: 30,
  },
  reviewText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  bottomBar: {
    flexDirection: 'row',
    padding: 14,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 10,
  },
  actionBtnFlex: {
    flex: 1,
  },
});
