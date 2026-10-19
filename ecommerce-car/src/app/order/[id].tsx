import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { colors, radii, spacing, typography } from '../../theme';
import { useAuthStore } from '../../store/useAuthStore';
import { useOrderStore } from '../../store/useOrderStore';
import { usePaymentStore } from '../../store/usePaymentStore';
import { globalAlert } from '../../store/useDialogStore';
import { useResponsive } from '../../hooks/useResponsive';
import { ResponsiveContainer } from '../../components/ui/ResponsiveContainer';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatVnd, formatVndPrice } from '../../utils/currency';
import { OrderStatus, DepositStatus, PaymentItem } from '../../types';
import { FALLBACK_CAR_URL } from '../../constants/images';
import { supabase } from '../../api/supabaseClient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isOrderExpired, getRemainingPaymentSeconds, formatCountdown } from '../../utils/orderUtils';
import { safeBack } from '../../utils/navigation';

export default function OrderDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id, app_trans_id } = useLocalSearchParams<{ id: string; app_trans_id?: string }>();
  const { user } = useAuthStore();
  const { selectedOrder, fetchOrderDetails, isLoading } = useOrderStore();
  const { checkPaymentStatus, createZaloPayOrder, openZaloPayUrl, isProcessing, statusResult } = usePaymentStore();
  const { isLargeScreen } = useResponsive();

  const [checkingPayment, setCheckingPayment] = useState(false);
  const [isOpeningPayment, setIsOpeningPayment] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => getRemainingPaymentSeconds(selectedOrder));

  // Countdown timer for 15-minute payment window
  useEffect(() => {
    if (!selectedOrder || selectedOrder.status !== 'pending' || selectedOrder.deposit_status !== 'unpaid') {
      return;
    }
    setRemainingSeconds(getRemainingPaymentSeconds(selectedOrder));
    const timer = setInterval(() => {
      const left = getRemainingPaymentSeconds(selectedOrder);
      setRemainingSeconds(left);
      if (left <= 0) {
        clearInterval(timer);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [selectedOrder]);

  // 1. Fetch chi tiết đơn hàng khi mount
  useEffect(() => {
    if (id && user?.id) {
      fetchOrderDetails(id);
    }
  }, [id, user?.id, fetchOrderDetails]);

  // 2. Lắng nghe thay đổi Realtime từ Supabase (Webhook hoặc Admin cập nhật)
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`order-realtime-${id}-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` },
        () => {
          useOrderStore.getState().fetchOrderDetails(id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const effectiveTransId = app_trans_id || selectedOrder?.app_trans_id;

  // 3. Tự động kiểm tra trạng thái ZaloPay định kỳ (polling mỗi 4s) khi đang mở trang và chưa thanh toán
  useEffect(() => {
    if (!effectiveTransId || !id || !selectedOrder || selectedOrder.deposit_status === 'paid' || isOrderExpired(selectedOrder)) {
      return;
    }
    const interval = setInterval(async () => {
      try {
        const res = await checkPaymentStatus(effectiveTransId);
        if (res.return_code === 1) {
          await fetchOrderDetails(id);
          clearInterval(interval);
        }
      } catch {
        // Im lặng khi poll định kỳ
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [effectiveTransId, id, selectedOrder?.deposit_status]);

  const handleCheckPaymentStatus = async () => {
    const transId = effectiveTransId;
    if (!transId) {
      globalAlert('Thông báo', 'Đơn hàng này chưa có mã giao dịch cổng ZaloPay.');
      return;
    }

    setCheckingPayment(true);
    try {
      const res = await checkPaymentStatus(transId);
      if (id) {
        await fetchOrderDetails(id);
      }
      if (res.return_code === 1) {
        globalAlert('Thành công', 'Đã xác nhận thanh toán cọc thành công từ ZaloPay!');
      } else {
        const subMsg = res.sub_return_code ? ` (Mã: ${res.return_code}, Phụ: ${res.sub_return_code})` : '';
        const msg = `${res.friendly_message || res.return_message || 'Chưa nhận được phản hồi.'}${subMsg}\n\n* Thử nghiệm Sandbox: Chọn Thẻ ATM -> Ngân hàng NCB -> Số thẻ: 9704198526191432198 (OTP: 111111).`;
        globalAlert('Trạng thái ZaloPay', msg);
      }
    } catch (err: any) {
      globalAlert('Lỗi kiểm tra', err.message || 'Không thể lấy trạng thái từ ZaloPay.');
    } finally {
      setCheckingPayment(false);
    }
  };

  const handleReopenPayment = async () => {
    if (!selectedOrder || !user) return;
    setIsOpeningPayment(true);
    try {
      const paymentItems: PaymentItem[] = (selectedOrder.order_items || []).map((it) => ({
        id: it.car_id || it.id,
        name: it.car ? `${it.car.make} ${it.car.model} (Cọc 10%)` : 'Xe ô tô AutoMatch (Cọc 10%)',
        price: Math.round((it.price || 0) * 0.10),
        itemCount: it.quantity || 1,
      }));

      const payload = {
        order_id: selectedOrder.id,
        items: paymentItems,
        email: user.email || '',
        address: selectedOrder.showroom?.address || '',
        name: user.user_metadata?.full_name || 'Khách hàng',
        phone: user.user_metadata?.phone || '',
        note: `Thanh toán cọc cho đơn hàng #${selectedOrder.id.slice(0, 8)}`,
        userid: user.id,
      };

      const response = await createZaloPayOrder(payload);
      if (response.return_code === 1 && response.order_url) {
        await openZaloPayUrl(response.order_url);
        if (id) {
          await fetchOrderDetails(id);
        }
      } else {
        globalAlert('Thông báo', response.return_message || 'Không thể tạo liên kết thanh toán mới.');
      }
    } catch (err: any) {
      globalAlert('Lỗi thanh toán', err.message || 'Không thể mở cổng thanh toán ZaloPay.');
    } finally {
      setIsOpeningPayment(false);
    }
  };

  const getOrderStatusBadge = (status: OrderStatus) => {
    if (isOrderExpired(selectedOrder)) {
      return <Badge label="Thất bại (Hết hạn)" variant="danger" size="xs" dot />;
    }
    switch (status) {
      case 'completed':
        return <Badge label="Đã giao xe" variant="success" size="xs" dot />;
      case 'ready_for_pickup':
        return <Badge label="Sẵn sàng nhận xe" variant="success" size="xs" dot />;
      case 'preparing_car':
        return <Badge label="Đang chuẩn bị xe" variant="primary" size="xs" dot />;
      case 'deposit_paid':
        return <Badge label="Đã đặt cọc 10%" variant="primary" size="xs" dot />;
      case 'cancelled':
        return <Badge label="Đã hủy" variant="danger" size="xs" dot />;
      case 'pending':
      default:
        return <Badge label="Chờ thanh toán cọc" variant="warning" size="xs" dot />;
    }
  };

  const getDepositStatusBadge = (depositStatus: DepositStatus) => {
    if (isOrderExpired(selectedOrder)) {
      return <Badge label="Hết hạn cọc" variant="danger" size="xs" dot />;
    }
    switch (depositStatus) {
      case 'paid':
        return <Badge label="Đã nộp cọc" variant="success" size="xs" dot />;
      case 'refunded':
        return <Badge label="Đã hoàn cọc" variant="danger" size="xs" dot />;
      case 'unpaid':
      default:
        return <Badge label="Chưa thanh toán cọc" variant="warning" size="xs" dot />;
    }
  };

  const fallbackImage = FALLBACK_CAR_URL;

  if (!user) {
    return (
      <View style={styles.screen}>
        <View style={styles.header}>
          <View style={styles.headerInner}>
            <TouchableOpacity style={styles.backBtn} onPress={() => safeBack()}>
              <Ionicons name="arrow-back" size={16} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Chi Tiết Hợp Đồng Đặt Cọc</Text>
          </View>
        </View>
        <EmptyState
          icon="lock-closed-outline"
          title="Yêu cầu đăng nhập"
          description="Vui lòng đăng nhập để xem thông tin hợp đồng và đơn hàng này."
          actionTitle="Đăng Nhập Ngay"
          onAction={() => router.push('/(auth)/login' as any)}
        />
      </View>
    );
  }

  if (isLoading || !selectedOrder) {
    return (
      <View style={[styles.screen, styles.centerBox]}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.loadingText}>Đang tải chi tiết đơn hàng...</Text>
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

  const updatedDate = new Date(selectedOrder.updated_at).toLocaleDateString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  // Safe resolution helper for order amounts (handles both new VND orders and legacy USD test orders)
  const resolveOrderVnd = (amount?: number | null): number => {
    if (!amount || amount <= 0) return 0;
    return amount < 1_000_000 ? Math.round(amount * 25400 * 2.54) : amount;
  };

  const totalAmountVnd = resolveOrderVnd(selectedOrder.total_amount);
  const discountAmountVnd = selectedOrder.discount_amount || 0;
  const depositAmountVnd = resolveOrderVnd(selectedOrder.deposit_amount) || Math.round(totalAmountVnd * 0.10);
  const remainingAmountVnd = resolveOrderVnd(selectedOrder.remaining_amount) || Math.round(totalAmountVnd * 0.90);
  const totalMSRP = totalAmountVnd + discountAmountVnd;

  const renderLeftInfo = () => (
    <>
      {/* 1. Order Status & Financial Summary Card */}
      <Card style={styles.overviewCard} padding={spacing.md}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardHeaderTitle}>Hồ sơ hợp đồng đặt cọc</Text>
          {getOrderStatusBadge(selectedOrder.status)}
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Mã đơn hàng:</Text>
          <Text style={styles.infoValueCode} numberOfLines={1}>{selectedOrder.id}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Trạng thái tiền cọc:</Text>
          {getDepositStatusBadge(selectedOrder.deposit_status)}
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Phương thức cọc:</Text>
          <Text style={styles.infoValue}>ZaloPay Gateway (Online)</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Ngày tạo:</Text>
          <Text style={styles.infoValue}>{createdDate}</Text>
        </View>

        <View style={styles.divider} />

        {/* Financial Details */}
        {selectedOrder.discount_amount > 0 && (
          <>
            <View style={styles.financialRow}>
              <Text style={styles.infoLabel}>Giá trị niêm yết:</Text>
              <Text style={styles.infoValue}>{formatVnd(totalMSRP)}</Text>
            </View>
            <View style={styles.financialRow}>
              <Text style={[styles.infoLabel, { color: colors.success }]}>
                Ưu đãi ({selectedOrder.voucher?.code || 'Voucher'}):
              </Text>
              <Text style={[styles.infoValue, { color: colors.success }]}>
                -{formatVnd(discountAmountVnd)}
              </Text>
            </View>
          </>
        )}

        <View style={styles.financialRow}>
          <Text style={styles.infoLabelBold}>Tổng giá trị xe sau ưu đãi:</Text>
          <Text style={styles.infoValueBold}>{formatVnd(totalAmountVnd)}</Text>
        </View>

        {/* Deposit Split Box */}
        <View style={styles.depositBox}>
          <View style={styles.depositRow}>
            <View>
              <Text style={styles.depositTitle}>Tiền đặt cọc trực tuyến (10%):</Text>
              <Text style={styles.depositSub}>Bảo lưu giá & xác lập quyền sở hữu</Text>
            </View>
            <Text style={styles.depositHighlight}>
              {formatVnd(depositAmountVnd)}
            </Text>
          </View>
          <View style={styles.remainingRow}>
            <Text style={styles.remainingLabel}>Còn lại thanh toán khi nhận xe tại Showroom:</Text>
            <Text style={styles.remainingAmount}>
              {formatVnd(remainingAmountVnd)}
            </Text>
          </View>
        </View>
      </Card>

      {/* 2. Showroom Pickup Information Card */}
      {selectedOrder.showroom && (
        <Card style={styles.showroomCard} padding={spacing.md}>
          <View style={styles.showroomHeaderRow}>
            <View style={styles.showroomIconBox}>
              <Ionicons name="business" size={16} color={colors.primaryHover} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.showroomCardTitle}>Showroom Bàn Giao & Nhận Xe</Text>
              <Text style={styles.showroomName}>{selectedOrder.showroom.name}</Text>
            </View>
          </View>

          <View style={styles.showroomDetailsList}>
            <View style={styles.showroomItem}>
              <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
              <Text style={styles.showroomText}>{selectedOrder.showroom.address}</Text>
            </View>
            <View style={styles.showroomItem}>
              <Ionicons name="call-outline" size={13} color={colors.textSecondary} />
              <Text style={styles.showroomText}>Hotline: {selectedOrder.showroom.phone || '1900 8888'}</Text>
            </View>
            <View style={styles.showroomItem}>
              <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
              <Text style={styles.showroomText}>Giờ mở cửa: {selectedOrder.showroom.opening_hours || '08:00 - 20:00'}</Text>
            </View>
          </View>
        </Card>
      )}

      {/* 3. ZaloPay Payment Status Card */}
      {(effectiveTransId || selectedOrder.payment_method === 'zalopay') && (
        <Card style={styles.paymentCard} padding={spacing.md}>
          <View style={styles.paymentHeaderRow}>
            <View style={styles.paymentIconBox}>
              <Ionicons name="wallet-outline" size={16} color="#0088FF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.paymentTitle}>Cổng Thanh Toán ZaloPay</Text>
              <Text style={styles.paymentSubtitle}>
                Mã GD: {effectiveTransId || 'Chưa có mã giao dịch'}
              </Text>
            </View>
            {getDepositStatusBadge(selectedOrder.deposit_status)}
          </View>

          {statusResult && (
            <View style={styles.statusResultBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                <Text style={styles.statusResultTitle}>Đối soát ZaloPay</Text>
                <Badge
                  label={
                    statusResult.return_code === 1
                      ? 'Thành công'
                      : statusResult.sub_return_code === -86
                      ? 'Chưa thanh toán (-86)'
                      : `Mã ${statusResult.return_code}`
                  }
                  variant={statusResult.return_code === 1 ? 'success' : 'warning'}
                  size="sm"
                />
              </View>
              <Text style={styles.statusResultText}>• {statusResult.friendly_message || statusResult.return_message}</Text>
              {statusResult.zp_trans_id ? (
                <Text style={styles.statusResultText}>• Mã GD ZaloPay: {statusResult.zp_trans_id}</Text>
              ) : null}
            </View>
          )}

          {selectedOrder.deposit_status === 'paid' ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs + 2, gap: 6 }}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={{ fontSize: 12, color: colors.success, fontWeight: '600' }}>
                Đã thanh toán cọc thành công qua cổng ZaloPay
              </Text>
            </View>
          ) : isOrderExpired(selectedOrder) ? (
            <View style={{ marginTop: spacing.sm, padding: spacing.sm, backgroundColor: 'rgba(239, 68, 68, 0.08)', borderRadius: radii.md, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.25)', gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="time-outline" size={16} color={colors.danger} />
                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.danger }}>
                  Giao dịch đã hết hạn thanh toán
                </Text>
              </View>
              <Text style={{ fontSize: 11.5, color: colors.textSecondary, lineHeight: 17 }}>
                Liên kết thanh toán ZaloPay chỉ có hiệu lực trong vòng 15 phút kể từ lúc khởi tạo đơn. Đơn hàng này đã quá thời hạn và được đánh dấu thất bại.
              </Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                <Button
                  title="Khám phá xe khác"
                  variant="outline"
                  size="sm"
                  onPress={() => router.push('/(tabs)/catalog' as any)}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          ) : (
            <View style={{ marginTop: spacing.xs + 2, gap: 8 }}>
              {remainingSeconds > 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(245, 158, 11, 0.1)', paddingVertical: 6, paddingHorizontal: 10, borderRadius: radii.sm, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.2)' }}>
                  <Ionicons name="hourglass-outline" size={13} color={colors.warning} />
                  <Text style={{ fontSize: 11.5, color: colors.warning, fontWeight: '600' }}>
                    Thời gian thanh toán còn lại: {formatCountdown(remainingSeconds)}
                  </Text>
                </View>
              )}
              <Button
                title={isOpeningPayment ? 'Đang mở cổng ZaloPay...' : 'Mở cổng thanh toán ZaloPay'}
                variant="primary"
                size="sm"
                onPress={handleReopenPayment}
                loading={isOpeningPayment}
                icon={<Ionicons name="open-outline" size={14} color="#FFFFFF" />}
              />
              <Button
                title={checkingPayment ? 'Đang kiểm tra...' : 'Kiểm tra & Đồng bộ trạng thái ZaloPay'}
                variant="outline"
                size="sm"
                onPress={handleCheckPaymentStatus}
                loading={checkingPayment || isProcessing}
                icon={<Ionicons name="refresh" size={12} color={colors.primaryHover} />}
              />
              <View style={styles.sandboxGuideBox}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Ionicons name="card-outline" size={13} color={colors.primaryHover} />
                  <Text style={styles.sandboxGuideTitle}>Hướng dẫn test ZaloPay Sandbox</Text>
                </View>
                <Text style={styles.sandboxGuideDesc}>
                  Sandbox không nhận app hoặc thẻ thật. Chọn <Text style={{ fontWeight: '700', color: colors.text }}>"Thẻ ATM"</Text> trên cổng ZaloPay và điền:
                </Text>
                <View style={styles.sandboxTable}>
                  <Text style={styles.sandboxRowText}><Text style={styles.sandboxRowLabel}>Ngân hàng:</Text> NCB</Text>
                  <Text style={styles.sandboxRowText}><Text style={styles.sandboxRowLabel}>Số thẻ:</Text> 9704 1985 2619 1432 198</Text>
                  <Text style={styles.sandboxRowText}><Text style={styles.sandboxRowLabel}>Chủ thẻ:</Text> NGUYEN VAN A</Text>
                  <Text style={styles.sandboxRowText}><Text style={styles.sandboxRowLabel}>Phát hành:</Text> 07/15  |  <Text style={styles.sandboxRowLabel}>OTP:</Text> 111111</Text>
                </View>
              </View>
            </View>
          )}
        </Card>
      )}
    </>
  );

  const renderRightItems = () => (
    <>
      {/* Ordered Car Items */}
      <Text style={styles.sectionTitle}>
        Danh sách xe đặt cọc ({selectedOrder.order_items?.length || 0})
      </Text>
      {selectedOrder.order_items?.map((item) => (
        <Card key={item.id} style={styles.itemCard} padding={spacing.sm}>
          <Image
            source={{ uri: item.car?.image_url || fallbackImage }}
            style={styles.itemThumb}
            contentFit="cover"
          />
          <View style={styles.itemInfo}>
            <Text style={styles.itemCarName}>
              {item.car ? `${item.car.make} ${item.car.model} (${item.car.year})` : 'Xe AutoMatch'}
            </Text>
            <Text style={styles.itemQuantity}>Số lượng: x{item.quantity} xe</Text>
            <Text style={styles.itemDepositPrice}>
              Giá niêm yết: {formatVndPrice(item.price, undefined, {
                engineHp: item.car?.engine_hp,
                fuelType: item.car?.metadata?.engine_fuel_type || item.car?.metadata?.fuel_type,
              })}
            </Text>
            {item.car?.showroom && (
              <View style={styles.carShowroomTag}>
                <Ionicons name="business-outline" size={10} color={colors.textMuted} />
                <Text style={styles.carShowroomText}>{item.car.showroom.name}</Text>
              </View>
            )}
          </View>
        </Card>
      ))}

      {/* Electronic Contract PDF Download */}
      {selectedOrder.contract_url && (
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.contractBox}
          onPress={() => Linking.openURL(selectedOrder.contract_url!)}
        >
          <View style={styles.contractIconCircle}>
            <Ionicons name="document-text-outline" size={16} color={colors.primaryHover} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.contractTitle}>Hợp Đồng Điện Tử</Text>
            <Text style={styles.contractSub}>
              Tải file hợp đồng điện tử đính kèm
            </Text>
          </View>
          <Ionicons name="download-outline" size={16} color={colors.primaryHover} />
        </TouchableOpacity>
      )}

      {/* Action Buttons */}
      <View style={styles.bottomActions}>
        <Button
          title="Danh sách đơn"
          variant="outline"
          size="sm"
          onPress={() => router.push('/orders' as any)}
          style={{ flex: 1 }}
        />
        <Button
          title="Khám phá xe"
          variant="primary"
          size="sm"
          onPress={() => router.push('/(tabs)/catalog' as any)}
          style={{ flex: 1 }}
        />
      </View>
    </>
  );

  return (
    <View style={styles.screen}>
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 44) }]}>
        <View style={styles.headerInner}>
          <TouchableOpacity style={styles.backBtn} onPress={() => safeBack()}>
            <Ionicons name="arrow-back" size={16} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>
              Đơn #{selectedOrder.id.slice(0, 8).toUpperCase()}
            </Text>
            <Text style={styles.headerSubtitle}>Cập nhật lần cuối: {updatedDate}</Text>
          </View>
          {getOrderStatusBadge(selectedOrder.status)}
        </View>
      </View>

      <ResponsiveContainer scrollable maxWidth="xl" showsVerticalScrollIndicator={false}>
        <View style={[styles.orderLayout, isLargeScreen && styles.orderLayoutSplit]}>
          {/* Left Column on Desktop / Top on Mobile */}
          <View style={[styles.orderCol, isLargeScreen && styles.orderColSplit]}>
            {renderLeftInfo()}
          </View>

          {/* Right Column on Desktop / Bottom on Mobile */}
          <View style={[styles.orderCol, isLargeScreen && styles.orderColSplit]}>
            {renderRightItems()}
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ResponsiveContainer>
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
    gap: spacing.sm,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
  },
  header: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  headerInner: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerTitle: {
    color: colors.text,
    fontSize: typography.sizes.sm + 1,
    fontWeight: typography.weights.semibold,
    lineHeight: 20,
  },
  headerSubtitle: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 1,
  },
  orderLayout: {
    width: '100%',
    paddingTop: spacing.xs,
  },
  orderLayoutSplit: {
    flexDirection: 'row',
    gap: spacing.xl,
    alignItems: 'flex-start',
    marginTop: spacing.sm,
  },
  orderCol: {
    width: '100%',
  },
  orderColSplit: {
    flex: 1,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.xs,
    marginTop: spacing.xs,
  },
  overviewCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    marginBottom: spacing.sm,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardHeaderTitle: {
    color: colors.text,
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.semibold,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 1,
  },
  infoLabel: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  infoValue: {
    color: colors.text,
    fontSize: 11,
    fontWeight: typography.weights.medium,
  },
  infoLabelBold: {
    color: colors.text,
    fontSize: 11,
    fontWeight: typography.weights.bold,
  },
  infoValueBold: {
    color: colors.text,
    fontSize: 12,
    fontWeight: typography.weights.bold,
  },
  infoValueCode: {
    color: colors.textMuted,
    fontSize: 10,
    fontFamily: 'monospace' as any,
    maxWidth: 180,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: 4,
  },
  depositBox: {
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    borderRadius: radii.sm,
    padding: spacing.sm,
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
    gap: 4,
  },
  depositRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  depositTitle: {
    color: colors.primaryHover,
    fontSize: 11,
    fontWeight: typography.weights.bold,
  },
  depositSub: {
    color: colors.textMuted,
    fontSize: 9,
    marginTop: 1,
  },
  depositHighlight: {
    color: colors.primaryHover,
    fontSize: typography.sizes.xs + 2,
    fontWeight: typography.weights.bold,
  },
  remainingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  remainingLabel: {
    color: colors.textSecondary,
    fontSize: 10,
  },
  remainingAmount: {
    color: colors.text,
    fontSize: 11,
    fontWeight: typography.weights.semibold,
  },
  showroomCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    gap: spacing.xs,
  },
  showroomHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  showroomIconBox: {
    width: 28,
    height: 28,
    borderRadius: radii.sm,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  showroomCardTitle: {
    color: colors.textMuted,
    fontSize: 9.5,
    textTransform: 'uppercase',
  },
  showroomName: {
    color: colors.text,
    fontSize: 11.5,
    fontWeight: typography.weights.semibold,
  },
  showroomDetailsList: {
    gap: 4,
    marginTop: 2,
  },
  showroomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  showroomText: {
    color: colors.textSecondary,
    fontSize: 10.5,
    flex: 1,
  },
  paymentCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  paymentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  paymentIconBox: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentTitle: {
    color: colors.text,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  paymentSubtitle: {
    color: colors.textMuted,
    fontSize: 10,
  },
  statusResultBox: {
    backgroundColor: colors.background,
    borderRadius: radii.sm,
    padding: spacing.xs + 4,
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  statusResultTitle: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: typography.weights.semibold,
  },
  statusResultText: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  sandboxGuideBox: {
    backgroundColor: 'rgba(59, 130, 246, 0.06)',
    borderRadius: radii.sm,
    padding: spacing.xs + 4,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    marginTop: 2,
  },
  sandboxGuideTitle: {
    fontSize: 11.5,
    fontWeight: typography.weights.semibold,
    color: colors.primaryHover,
  },
  sandboxGuideDesc: {
    fontSize: 10.5,
    color: colors.textSecondary,
    lineHeight: 14,
    marginBottom: 4,
  },
  sandboxTable: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: radii.xs,
    padding: 6,
    gap: 2,
  },
  sandboxRowText: {
    fontSize: 10.5,
    color: colors.text,
  },
  sandboxRowLabel: {
    color: colors.textMuted,
    fontWeight: typography.weights.medium,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  itemThumb: {
    width: 70,
    height: 48,
    borderRadius: radii.xs,
    backgroundColor: colors.surfaceElevated,
  },
  itemInfo: {
    flex: 1,
  },
  itemCarName: {
    color: colors.text,
    fontSize: 11,
    fontWeight: typography.weights.semibold,
  },
  itemQuantity: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 1,
  },
  itemDepositPrice: {
    color: colors.primaryHover,
    fontSize: 10.5,
    fontWeight: typography.weights.medium,
    marginTop: 1,
  },
  carShowroomTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  carShowroomText: {
    color: colors.textMuted,
    fontSize: 9,
  },
  contractBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    padding: spacing.sm,
    gap: spacing.sm,
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  contractIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contractTitle: {
    color: colors.text,
    fontSize: 11,
    fontWeight: typography.weights.semibold,
  },
  contractSub: {
    color: colors.textMuted,
    fontSize: 9.5,
  },
  bottomActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
