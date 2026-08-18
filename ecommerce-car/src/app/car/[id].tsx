import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography, shadows } from '../../theme';
import { useCarStore } from '../../store/useCarStore';
import { useCartStore } from '../../store/useCartStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useTestDriveStore } from '../../store/useTestDriveStore';
import { historyService } from '../../services/historyService';
import { reviewService } from '../../services/reviewService';
import { qaService } from '../../services/qaService';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { PriceTag } from '../../components/ui/PriceTag';
import { RatingStars } from '../../components/ui/RatingStars';
import { CarSpecTable } from '../../components/car/CarSpecTable';
import { InstallmentCalculator } from '../../components/car/InstallmentCalculator';
import { TestDriveModal } from '../../components/car/TestDriveModal';
import { ReviewModal } from '../../components/car/ReviewModal';
import { QAModal } from '../../components/car/QAModal';
import { CarCard } from '../../components/car/CarCard';
import { Review, CarQA } from '../../types';
import { FALLBACK_CAR_URL } from '../../constants/images';

export default function CarDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { selectedCar, fetchCarDetails, topCars, savedCars, toggleSaveCar, isLoading, error } = useCarStore();
  const { addToCart } = useCartStore();
  const { user } = useAuthStore();
  const { bookTestDrive } = useTestDriveStore();

  const [activeTab, setActiveTab] = useState<'specs' | 'calculator' | 'reviews' | 'qa'>('specs');
  const [selectedGalleryIdx, setSelectedGalleryIdx] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [qaList, setQaList] = useState<CarQA[]>([]);
  const [isTestDriveModalVisible, setIsTestDriveModalVisible] = useState(false);
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
  const [isQAModalVisible, setIsQAModalVisible] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCarDetails(id);
      reviewService.getCarReviews(id).then(setReviews).catch(() => {});
      qaService.getCarQA(id).then(setQaList).catch(() => {});

      if (user?.id) {
        historyService.logViewedCar(user.id, id).catch(() => {});
      }
    }
  }, [id, fetchCarDetails, user]);

  const isSaved = savedCars.some((sc) => sc.car_id === id);

  const galleryImages = useMemo(() => {
    if (!selectedCar) return [];
    if (selectedCar.metadata?.gallery && selectedCar.metadata.gallery.length > 0) {
      return selectedCar.metadata.gallery;
    }
    return [
      selectedCar.image_url || FALLBACK_CAR_URL,
    ];
  }, [selectedCar]);

  const relatedCars = useMemo(() => {
    if (!selectedCar) return [];
    return topCars
      .filter((c) => c.id !== selectedCar.id)
      .slice(0, 4);
  }, [topCars, selectedCar]);

  const handleToggleSave = () => {
    if (id) {
      toggleSaveCar(id, user?.id);
    }
  };

  const handleAddToCart = async () => {
    if (!id) return;
    try {
      await addToCart(user?.id, id, 1);
      Alert.alert('Thành công', 'Đã thêm xe vào danh sách đặt cọc.', [
        { text: 'Xem tiếp', style: 'cancel' },
        { text: 'Xem giỏ hàng', onPress: () => router.push('/cart' as any) },
      ]);
    } catch {
      Alert.alert('Lỗi', 'Không thể thêm vào giỏ hàng.');
    }
  };

  const handleDirectDeposit = async () => {
    if (!id) return;
    try {
      await addToCart(user?.id, id, 1);
      router.push('/checkout' as any);
    } catch {
      Alert.alert('Lỗi', 'Không thể chuyển đến thanh toán.');
    }
  };

  const handleSubmitTestDrive = async (scheduledDate: string, notes?: string) => {
    if (!id) return;
    await bookTestDrive(user?.id, id, scheduledDate, notes);
  };

  const handleSubmitReview = async (rating: number, comment: string, authorName: string) => {
    if (!id) return;
    const newRev = await reviewService.addReview(id, user?.id, rating, comment, authorName);
    setReviews((prev) => [newRev, ...prev]);
  };

  const handleSubmitQA = async (question: string) => {
    if (!id) return;
    const newQA = await qaService.askQuestion(id, user?.id, question);
    setQaList((prev) => [newQA, ...prev]);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerBox]}>
        <ActivityIndicator color={colors.primary} size="small" />
        <Text style={styles.loadingText}>Đang tải chi tiết xe...</Text>
      </View>
    );
  }

  if (error || !selectedCar) {
    return (
      <View style={[styles.container, styles.centerBox]}>
        <Ionicons name="alert-circle-outline" size={40} color={colors.danger} />
        <Text style={styles.errorText}>{error || 'Không tìm thấy thông tin xe'}</Text>
        <Button
          title="Quay lại Kho xe"
          variant="outline"
          onPress={() => router.back()}
          style={{ marginTop: spacing.md }}
        />
      </View>
    );
  }

  const currentImage = galleryImages[selectedGalleryIdx] || galleryImages[0];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Main Hero Gallery */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: currentImage }} style={styles.heroImage} contentFit="cover" />

          {/* Top floating actions */}
          <TouchableOpacity
            style={styles.floatingBackBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={18} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.floatingSaveBtn}
            onPress={handleToggleSave}
          >
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={18}
              color={isSaved ? colors.primaryHover : colors.text}
            />
          </TouchableOpacity>

          <View style={styles.galleryBadge}>
            <Text style={styles.galleryBadgeText}>
              {selectedGalleryIdx + 1} / {galleryImages.length}
            </Text>
          </View>
        </View>

        {/* Thumbnail Selector if multiple photos */}
        {galleryImages.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.thumbScroll}
            contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.xs + 2 }}
          >
            {galleryImages.map((uri, idx) => (
              <TouchableOpacity
                key={uri + idx}
                activeOpacity={0.8}
                onPress={() => setSelectedGalleryIdx(idx)}
                style={[
                  styles.thumbItem,
                  selectedGalleryIdx === idx && styles.thumbItemActive,
                ]}
              >
                <Image source={{ uri }} style={styles.thumbImg} contentFit="cover" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <View style={styles.content}>
          {/* Header Title & Badges */}
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.makeModel}>
                {selectedCar.make} {selectedCar.model}
              </Text>
              <Text style={styles.yearSubtitle}>
                Năm {selectedCar.year} • {selectedCar.metadata?.body_type || selectedCar.metadata?.engine_fuel_type || 'Showroom'}
              </Text>
            </View>
          </View>

          {/* Pricing & Stock Status */}
          <View style={styles.priceCardRow}>
            <PriceTag
              price={selectedCar.price}
              size="lg"
              showInstallment
            />
            <Badge
              label={
                selectedCar.stock_quantity > 0
                  ? `Sẵn ${selectedCar.stock_quantity} xe`
                  : 'Đặt trước'
              }
              variant={selectedCar.stock_quantity > 0 ? 'success' : 'warning'}
              size="sm"
              dot
            />
          </View>

          {/* Navigation Tabs (Specs / Loan / Reviews / Q&A) */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setActiveTab('specs')}
              style={[styles.tabBtn, activeTab === 'specs' && styles.tabBtnActive]}
            >
              <Text style={[styles.tabText, activeTab === 'specs' && styles.tabTextActive]}>
                Thông Số
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setActiveTab('calculator')}
              style={[styles.tabBtn, activeTab === 'calculator' && styles.tabBtnActive]}
            >
              <Text style={[styles.tabText, activeTab === 'calculator' && styles.tabTextActive]}>
                Dự Toán Vay
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setActiveTab('reviews')}
              style={[styles.tabBtn, activeTab === 'reviews' && styles.tabBtnActive]}
            >
              <Text style={[styles.tabText, activeTab === 'reviews' && styles.tabTextActive]}>
                Đánh Giá ({reviews.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setActiveTab('qa')}
              style={[styles.tabBtn, activeTab === 'qa' && styles.tabBtnActive]}
            >
              <Text style={[styles.tabText, activeTab === 'qa' && styles.tabTextActive]}>
                Hỏi Đáp ({qaList.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab 1: Technical Specs */}
          {activeTab === 'specs' && (
            <View style={styles.tabContent}>
              <CarSpecTable car={selectedCar} />
            </View>
          )}

          {/* Tab 2: Loan Installment Calculator */}
          {activeTab === 'calculator' && (
            <View style={styles.tabContent}>
              <InstallmentCalculator price={selectedCar.price || 2000000000} />
            </View>
          )}

          {/* Tab 3: Reviews & Ratings */}
          {activeTab === 'reviews' && (
            <View style={styles.tabContent}>
              <View style={styles.reviewHeaderRow}>
                <View>
                  <Text style={styles.reviewSectionTitle}>Đánh Giá Trải Nghiệm</Text>
                  {reviews.length > 0 ? (
                    <RatingStars
                      rating={reviews.reduce((acc, curr) => acc + (curr.rating || 0), 0) / reviews.length}
                      size={14}
                      showScore
                      scoreText={`${(reviews.reduce((acc, curr) => acc + (curr.rating || 0), 0) / reviews.length).toFixed(1)} / 5 (${reviews.length} đánh giá)`}
                    />
                  ) : (
                    <Text style={{ color: colors.textMuted, fontSize: typography.sizes.xs }}>
                      Chưa có đánh giá nào
                    </Text>
                  )}
                </View>
                <Button
                  title="Viết Đánh Giá"
                  size="sm"
                  variant="outline"
                  onPress={() => setIsReviewModalVisible(true)}
                  icon={<Ionicons name="create-outline" size={13} color={colors.primaryHover} />}
                />
              </View>

              {reviews.map((rev) => (
                <Card key={rev.id} style={styles.reviewCard} padding={spacing.sm + 2}>
                  <View style={styles.reviewUserRow}>
                    <View style={styles.reviewAvatar}>
                      <Text style={styles.reviewAvatarText}>
                        {(rev.profiles?.full_name || 'U')[0].toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.reviewUserName}>
                        {rev.profiles?.full_name || 'Khách Hàng AutoMatch'}
                      </Text>
                      <RatingStars rating={rev.rating || 5} size={11} />
                    </View>
                    <Text style={styles.reviewDate}>
                      {rev.created_at ? new Date(rev.created_at).toLocaleDateString('vi-VN') : 'Gần đây'}
                    </Text>
                  </View>
                  <Text style={styles.reviewComment}>{rev.comment}</Text>
                </Card>
              ))}
            </View>
          )}

          {/* Tab 4: Q&A Community */}
          {activeTab === 'qa' && (
            <View style={styles.tabContent}>
              <View style={styles.reviewHeaderRow}>
                <Text style={styles.reviewSectionTitle}>Hỏi Đáp & Tư Vấn</Text>
                <Button
                  title="Đặt Câu Hỏi"
                  size="sm"
                  variant="outline"
                  onPress={() => setIsQAModalVisible(true)}
                  icon={<Ionicons name="chatbubbles-outline" size={13} color={colors.primaryHover} />}
                />
              </View>

              {qaList.map((qa) => (
                <Card key={qa.id} style={styles.qaCard} padding={spacing.sm + 2}>
                  <View style={styles.qaQuestionRow}>
                    <Ionicons name="help-circle-outline" size={16} color={colors.primaryHover} />
                    <Text style={styles.qaQuestionText}>{qa.question}</Text>
                  </View>

                  {qa.answer && (
                    <View style={styles.qaAnswerBox}>
                      <Text style={styles.qaAnswerBadge}>Phản hồi từ chuyên gia:</Text>
                      <Text style={styles.qaAnswerText}>{qa.answer}</Text>
                    </View>
                  )}
                </Card>
              ))}
            </View>
          )}

          {/* Similar / Related Cars Carousel */}
          <Text style={styles.relatedSectionTitle}>Mẫu Xe Tương Tự</Text>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={relatedCars}
            keyExtractor={(c) => c.id}
            contentContainerStyle={{ paddingBottom: spacing.sm }}
            renderItem={({ item: c }) => (
              <CarCard
                car={c}
                layout="compact"
                onPressDetails={(carId) => router.push(`/car/${carId}` as any)}
                onPressCompare={() => router.push('/(tabs)/compare' as any)}
              />
            )}
          />
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.chatAiBtn}
          onPress={() =>
            router.push({
              pathname: '/(tabs)/ai-chat' as any,
              params: { initialPrompt: `Tư vấn chi tiết cho tôi về xe ${selectedCar.make} ${selectedCar.model}` },
            })
          }
        >
          <Ionicons name="sparkles" size={16} color={colors.primaryHover} />
          <Text style={styles.chatAiText}>Hỏi AI</Text>
        </TouchableOpacity>

        <Button
          title="Lái Thử"
          variant="outline"
          size="sm"
          onPress={() => setIsTestDriveModalVisible(true)}
          style={styles.testDriveBtn}
        />

        <Button
          title="Thêm Giỏ"
          variant="secondary"
          size="sm"
          onPress={handleAddToCart}
          style={styles.addToCartBtn}
          icon={<Ionicons name="bag-handle-outline" size={14} color={colors.text} />}
        />

        <Button
          title="Đặt Cọc"
          variant="primary"
          size="sm"
          onPress={handleDirectDeposit}
          style={styles.depositBtn}
          icon={<Ionicons name="flash-outline" size={14} color="#FFFFFF" />}
        />
      </View>

      {/* Modals */}
      <TestDriveModal
        visible={isTestDriveModalVisible}
        onClose={() => setIsTestDriveModalVisible(false)}
        car={selectedCar}
        onSubmitBooking={handleSubmitTestDrive}
      />

      <ReviewModal
        visible={isReviewModalVisible}
        onClose={() => setIsReviewModalVisible(false)}
        carName={`${selectedCar.make} ${selectedCar.model}`}
        onSubmitReview={handleSubmitReview}
      />

      <QAModal
        visible={isQAModalVisible}
        onClose={() => setIsQAModalVisible(false)}
        carName={`${selectedCar.make} ${selectedCar.model}`}
        onSubmitQuestion={handleSubmitQA}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerBox: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
  },
  imageContainer: {
    height: 230,
    width: '100%',
    position: 'relative',
    backgroundColor: colors.surfaceElevated,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  floatingBackBtn: {
    position: 'absolute',
    top: 46,
    left: spacing.md,
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: 'rgba(9, 10, 12, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingSaveBtn: {
    position: 'absolute',
    top: 46,
    right: spacing.md,
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: 'rgba(9, 10, 12, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(9, 10, 12, 0.8)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.xs,
  },
  galleryBadgeText: {
    color: colors.text,
    fontSize: 10,
    fontWeight: typography.weights.bold,
  },
  thumbScroll: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  thumbItem: {
    width: 52,
    height: 36,
    borderRadius: radii.xs,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumbItemActive: {
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  thumbImg: {
    width: '100%',
    height: '100%',
  },
  content: {
    padding: spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  makeModel: {
    color: colors.text,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    letterSpacing: -0.2,
  },
  yearSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes['2xs'] + 1,
    marginTop: 2,
  },
  priceCardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginVertical: spacing.xs + 2,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 2,
    marginVertical: spacing.md,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.xs,
  },
  tabBtnActive: {
    backgroundColor: colors.primaryMuted,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: typography.sizes['2xs'] + 1,
    fontWeight: typography.weights.medium,
  },
  tabTextActive: {
    color: colors.primaryHover,
    fontWeight: typography.weights.semibold,
  },
  tabContent: {
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  reviewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm + 2,
  },
  reviewSectionTitle: {
    color: colors.text,
    fontSize: typography.sizes.sm + 1,
    fontWeight: typography.weights.semibold,
    marginBottom: 2,
  },
  reviewCard: {
    marginBottom: spacing.xs + 2,
  },
  reviewUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  reviewAvatarText: {
    color: '#FFF',
    fontWeight: typography.weights.bold,
    fontSize: 10,
  },
  reviewUserName: {
    color: colors.text,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  reviewDate: {
    color: colors.textMuted,
    fontSize: typography.sizes['2xs'],
  },
  reviewComment: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    lineHeight: 16,
  },
  qaCard: {
    marginBottom: spacing.xs + 2,
  },
  qaQuestionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    marginBottom: 4,
  },
  qaQuestionText: {
    color: colors.text,
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.semibold,
    flex: 1,
  },
  qaAnswerBox: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.xs,
    padding: spacing.xs + 2,
    borderLeftWidth: 2,
    borderLeftColor: colors.primary,
    marginTop: 3,
  },
  qaAnswerBadge: {
    color: colors.primaryHover,
    fontSize: 10,
    fontWeight: typography.weights.semibold,
    marginBottom: 1,
  },
  qaAnswerText: {
    color: colors.textSecondary,
    fontSize: typography.sizes['2xs'] + 1,
    lineHeight: 15,
  },
  relatedSectionTitle: {
    color: colors.text,
    fontSize: typography.sizes.sm + 1,
    fontWeight: typography.weights.semibold,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs + 2,
    paddingBottom: 22,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
    gap: 6,
    ...shadows.md,
  },
  chatAiBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  chatAiText: {
    color: colors.primaryHover,
    fontSize: 10,
    fontWeight: typography.weights.medium,
    marginTop: 1,
  },
  testDriveBtn: {
    flex: 1.1,
    height: 38,
  },
  addToCartBtn: {
    flex: 1.1,
    height: 38,
  },
  depositBtn: {
    flex: 1.2,
    height: 38,
  },
});

