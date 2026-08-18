import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { colors, radii, spacing, typography, shadows } from '../../theme';
import { useOrderStore } from '../../store/useOrderStore';
import { usePaymentStore } from '../../store/usePaymentStore';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatVndPrice } from '../../components/ui/PriceTag';
import { OrderTimelineStep } from '../../types';

export default function OrderDetailScreen() {
  const { id, app_trans_id } = useLocalSearchParams<{ id: string; app_trans_id?: string }>();
  const { selectedOrder, fetchOrderDetails, isLoading } = useOrderStore();
  const { checkPaymentStatus, isProcessing, statusResult } = usePaymentStore();

  const [checkingPayment, setCheckingPayment] = useState(false);

  useEffect(() => {
    if (id) {
      fetchOrderDetails(id);
    }
  }, [id, fetchOrderDetails]);

  const handleCheckPaymentStatus = async () => {
    const transId = app_trans_id || selectedOrder?.app_trans_id;
    if (!transId) {
      Alert.alert('Thông báo', 'Không tìm thấy mã giao dịch ZaloPay (app_trans_id).');
      return;
    }

    setCheckingPayment(true);
    try {
      const res = await checkPaymentStatus(transId);
      if (id) {
        await fetchOrderDetails(id);
      }
      Alert.alert(
        res.return_code === 1 ? 'Thành Công' : 'Trạng Thái ZaloPay',
        `Phản hồi: ${res.return_message}`
      );
    } catch (err: any) {
      Alert.alert('Lỗi kiểm tra', err.message || 'Không thể lấy trạng thái từ ZaloPay.');
    } finally {
      setCheckingPayment(false);
    }
  };

  const fallbackImage =
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=800';

  if (isLoading || !selectedOrder) {
    return (
      <View style={[styles.screen, styles.centerBox]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Đang tải chi tiết đơn hàng từ Supabase...</Text>
      </View>
    );
  }

  const createdDate = new Date(selectedOrder.created_at).toLocaleDateString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const timelineSteps: OrderTimelineStep[] = [
    {
      id: 'step-1',
      title: 'Đặt Cọc Giữ Chỗ Thành Công',
      description: 'Hệ thống đã nhận khoản cọc và bảo lưu giá niêm yết trong 30 ngày.',
      date: createdDate,
      isCompleted: true,
      isCurrent: selectedOrder.status === 'pending',
    },
    {
      id: 'step-2',
      title: 'Showroom Tiếp Nhận & Khóa Xe',
      description: 'Chuyên viên AutoMatch chuẩn bị hồ sơ xe và xếp lịch bàn giao.',
      isCompleted: selectedOrder.status === 'processing' || selectedOrder.status === 'completed',
      isCurrent: selectedOrder.status === 'processing',
    },
    {
      id: 'step-3',
      title: 'Ký Hợp Đồng Điện Tử',
      description: 'Hợp đồng mua bán chính hãng có chữ ký số điện tử được gửi qua email.',
      isCompleted: selectedOrder.status === 'completed',
      isCurrent: false,
    },
    {
      id: 'step-4',
      title: 'Kiểm Tra Kỹ Thuật (PDI) & Phủ Ceramic',
      description: 'Quy trình kiểm tra 176 hạng mục kỹ thuật tiêu chuẩn khắt khe.',
      isCompleted: selectedOrder.status === 'completed',
      isCurrent: false,
    },
    {
      id: 'step-5',
      title: 'Bàn Giao Xe & Giấy Tờ',
      description: 'Trao chìa khóa và hoàn tất thủ tục đăng ký xe.',
      isCompleted: selectedOrder.status === 'completed',
      isCurrent: false,
    },
  ];

  return (
    <View style={styles.screen}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>
            Đơn #{selectedOrder.id.slice(0, 10).toUpperCase()}
          </Text>
          <Text style={styles.headerSubtitle}>Ngày tạo: {createdDate}</Text>
        </View>
        <Badge
          label={
            selectedOrder.status === 'processing'
              ? 'Đang Xử Lý'
              : selectedOrder.status === 'completed'
              ? 'Đã Bàn Giao'
              : selectedOrder.status === 'cancelled'
              ? 'Đã Hủy'
              : 'Chờ Xác Nhận'
          }
          variant={
            selectedOrder.status === 'processing'
              ? 'primary'
              : selectedOrder.status === 'completed'
              ? 'success'
              : selectedOrder.status === 'cancelled'
              ? 'danger'
              : 'warning'
          }
          size="sm"
          dot
        />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Visual Progress Timeline */}
        <Card style={styles.timelineCard}>
          <Text style={styles.sectionTitle}>📍 Tiến Độ Xử Lý & Bàn Giao Xe</Text>

          <View style={styles.timelineList}>
            {timelineSteps.map((step, idx) => {
              const isLast = idx === timelineSteps.length - 1;
              return (
                <View key={step.id} style={styles.timelineItem}>
                  {/* Left icon & connector line */}
                  <View style={styles.timelineLeftCol}>
                    <View
                      style={[
                        styles.timelineNode,
                        step.isCompleted
                          ? styles.timelineNodeDone
                          : step.isCurrent
                          ? styles.timelineNodeCurrent
                          : styles.timelineNodePending,
                      ]}
                    >
                      {step.isCompleted ? (
                        <Ionicons name="checkmark" size={14} color="#000" />
                      ) : (
                        <Text style={styles.nodeNumber}>{idx + 1}</Text>
                      )}
                    </View>
                    {!isLast && (
                      <View
                        style={[
                          styles.timelineLine,
                          step.isCompleted ? styles.timelineLineDone : styles.timelineLinePending,
                        ]}
                      />
                    )}
                  </View>

                  {/* Right content */}
                  <View style={styles.timelineContent}>
                    <Text
                      style={[
                        styles.stepTitle,
                        step.isCompleted || step.isCurrent
                          ? { color: colors.text }
                          : { color: colors.textMuted },
                      ]}
                    >
                      {step.title}
                    </Text>
                    <Text style={styles.stepDesc}>{step.description}</Text>
                    {step.date && <Text style={styles.stepDate}>⏰ {step.date}</Text>}
                  </View>
                </View>
              );
            })}
          </View>
        </Card>

        {/* ZaloPay Payment Status Card */}
        <Card style={styles.paymentCard}>
          <View style={styles.paymentHeaderRow}>
            <View style={styles.paymentIconBox}>
              <Ionicons name="wallet-outline" size={20} color="#0088FF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.paymentTitle}>Trạng Thái Thanh Toán ZaloPay</Text>
              <Text style={styles.paymentSubtitle}>Cổng thanh toán điện tử chính thức</Text>
            </View>
            <Badge
              label={
                selectedOrder.payment_status === 'paid'
                  ? 'Đã Thanh Toán'
                  : 'Chờ Thanh Toán'
              }
              variant={selectedOrder.payment_status === 'paid' ? 'success' : 'warning'}
              size="sm"
              dot
            />
          </View>

          {(app_trans_id || selectedOrder.app_trans_id) && (
            <View style={styles.transCodeBox}>
              <Text style={styles.transCodeLabel}>Mã giao dịch (app_trans_id):</Text>
              <Text style={styles.transCodeValue}>
                {app_trans_id || selectedOrder.app_trans_id}
              </Text>
            </View>
          )}

          {statusResult && (
            <View style={styles.statusResultBox}>
              <Text style={styles.statusResultTitle}>Kết Quả Kiểm Tra:</Text>
              <Text style={styles.statusResultText}>• {statusResult.return_message}</Text>
              {statusResult.zp_trans_id && (
                <Text style={styles.statusResultText}>• Mã ZaloPay: {statusResult.zp_trans_id}</Text>
              )}
            </View>
          )}

          <Button
            title={checkingPayment ? 'Đang Kiểm Tra...' : 'Cập Nhật Trạng Thái ZaloPay'}
            variant="outline"
            size="sm"
            onPress={handleCheckPaymentStatus}
            loading={checkingPayment || isProcessing}
            icon={<Ionicons name="refresh" size={14} color={colors.primary} />}
            style={{ marginTop: spacing.sm }}
          />
        </Card>

        {/* Ordered Car Details */}
        <Text style={styles.sectionTitle}>🚘 Danh Sách Xe Trong Đơn</Text>
        {selectedOrder.order_items?.map((item) => (
          <Card key={item.id} style={styles.itemCard}>
            <Image
              source={{ uri: item.car?.image_url || fallbackImage }}
              style={styles.itemThumb}
              contentFit="cover"
            />
            <View style={styles.itemInfo}>
              <Text style={styles.itemCarName}>
                {item.car ? `${item.car.make} ${item.car.model} (${item.car.year})` : 'Xe AutoMatch'}
              </Text>
              <Text style={styles.itemDepositPrice}>
                Tiền cọc: {formatVndPrice(item.price)} (x{item.quantity})
              </Text>
              <Text style={styles.itemTotalCarPrice}>
                Giá xe: {formatVndPrice(item.car?.price)}
              </Text>
            </View>
          </Card>
        ))}

        {/* Showroom & Delivery Contact Card */}
        <Card style={styles.contactCard}>
          <Text style={styles.contactCardTitle}>📍 Địa Điểm Bàn Giao & Nhận Xe</Text>
          <Text style={styles.showroomName}>
            {selectedOrder.showroom_address || 'AutoMatch Center - 68 Nguyễn Huệ, Quận 1, TP.HCM'}
          </Text>

          <View style={styles.divider} />

          <Text style={styles.contactCardTitle}>👤 Người Nhận Hồ Sơ Xe</Text>
          <Text style={styles.contactName}>{selectedOrder.customer_name || 'Khách Hàng VIP'}</Text>
          <Text style={styles.contactPhone}>📞 {selectedOrder.customer_phone || '0908889999'}</Text>
          <Text style={styles.contactEmail}>✉️ {selectedOrder.customer_email || 'khachhang.vip@automatch.ai'}</Text>
        </Card>

        {/* Electronic Contract PDF Download */}
        {selectedOrder.contract_url && (
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.contractBox}
            onPress={() => Linking.openURL(selectedOrder.contract_url!)}
          >
            <View style={styles.contractIconCircle}>
              <Ionicons name="document-text" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.contractTitle}>Hợp Đồng Mua Bán Xe Điện Tử</Text>
              <Text style={styles.contractSub}>
                Nhấp để tải xuống bản PDF có chữ ký số điện tử hợp pháp
              </Text>
            </View>
            <Ionicons name="download-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
        )}

        {/* Support Hotline CTA */}
        <View style={styles.supportBox}>
          <Text style={styles.supportTitle}>Cần Hỗ Trợ Giao Xe Hoặc Thủ Tục?</Text>
          <Text style={styles.supportSub}>Hotline VIP 24/7 của AutoMatch: 1900 8888</Text>
          <Button
            title="Gọi Hotline Hỗ Trợ"
            size="sm"
            variant="secondary"
            onPress={() => Linking.openURL('tel:19008888')}
            icon={<Ionicons name="call-outline" size={14} color="#FFF" />}
            style={{ marginTop: spacing.sm, alignSelf: 'flex-start' }}
          />
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerBox: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 52,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: colors.text,
    fontSize: typography.sizes.base + 1,
    fontWeight: typography.weights.bold,
  },
  headerSubtitle: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    marginTop: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  timelineCard: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  timelineList: {
    marginTop: spacing.sm,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 70,
  },
  timelineLeftCol: {
    alignItems: 'center',
    width: 30,
    marginRight: spacing.md,
  },
  timelineNode: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  timelineNodeDone: {
    backgroundColor: colors.primary,
  },
  timelineNodeCurrent: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
    borderWidth: 2,
  },
  timelineNodePending: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  nodeNumber: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginVertical: 2,
  },
  timelineLineDone: {
    backgroundColor: colors.primary,
  },
  timelineLinePending: {
    backgroundColor: colors.border,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: spacing.md,
  },
  stepTitle: {
    fontSize: typography.sizes.sm + 1,
    fontWeight: typography.weights.bold,
  },
  stepDesc: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    lineHeight: 16,
    marginTop: 2,
  },
  stepDate: {
    color: colors.primary,
    fontSize: typography.sizes['2xs'],
    fontWeight: typography.weights.semibold,
    marginTop: 3,
  },
  paymentCard: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderColor: 'rgba(0, 136, 255, 0.25)',
  },
  paymentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  paymentIconBox: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: 'rgba(0, 136, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentTitle: {
    color: colors.text,
    fontSize: typography.sizes.sm + 1,
    fontWeight: typography.weights.bold,
  },
  paymentSubtitle: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
  },
  transCodeBox: {
    backgroundColor: 'rgba(0, 136, 255, 0.08)',
    borderRadius: radii.sm,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  transCodeLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
  },
  transCodeValue: {
    color: colors.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    marginTop: 2,
  },
  statusResultBox: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.sm,
    padding: spacing.sm,
    marginTop: spacing.sm,
    gap: 2,
  },
  statusResultTitle: {
    color: colors.textMuted,
    fontSize: typography.sizes['2xs'],
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
  },
  statusResultText: {
    color: colors.text,
    fontSize: typography.sizes.xs,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm + 2,
    marginBottom: spacing.sm,
  },
  itemThumb: {
    width: 75,
    height: 55,
    borderRadius: radii.sm,
    marginRight: spacing.md,
  },
  itemInfo: {
    flex: 1,
  },
  itemCarName: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  itemDepositPrice: {
    color: colors.primary,
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.bold,
    marginTop: 2,
  },
  itemTotalCarPrice: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
  },
  contactCard: {
    marginTop: spacing.md,
    padding: spacing.md,
    gap: 3,
  },
  contactCardTitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  showroomName: {
    color: colors.text,
    fontSize: typography.sizes.sm + 1,
    fontWeight: typography.weights.bold,
    marginBottom: 4,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  contactName: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  contactPhone: {
    color: colors.primary,
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.semibold,
  },
  contactEmail: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
  },
  contractBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginTop: spacing.md,
    gap: spacing.md,
    ...shadows.glowCyan,
  },
  contractIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contractTitle: {
    color: colors.text,
    fontSize: typography.sizes.sm + 1,
    fontWeight: typography.weights.bold,
  },
  contractSub: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  supportBox: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  supportTitle: {
    color: colors.text,
    fontSize: typography.sizes.sm + 1,
    fontWeight: typography.weights.bold,
  },
  supportSub: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
});
