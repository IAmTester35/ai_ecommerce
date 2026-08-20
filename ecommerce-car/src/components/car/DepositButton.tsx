import React, { useState, useRef } from 'react';
import {
  Text,
  StyleSheet,
  Animated,
  Pressable,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '../../theme';
import { useAuthStore } from '../../store/useAuthStore';
import { useCartStore } from '../../store/useCartStore';
import { ModalSheet } from '../ui/ModalSheet';
import { Button } from '../ui/Button';

export type DepositButtonVariant = 'primary' | 'secondary' | 'outline' | 'pill' | 'mini';
export type DepositButtonSize = 'sm' | 'md' | 'lg';

export interface DepositButtonProps {
  carId: string;
  quantity?: number;
  title?: string;
  successTitle?: string;
  variant?: DepositButtonVariant;
  size?: DepositButtonSize;
  showIcon?: boolean;
  directCheckout?: boolean;
  onSuccess?: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
}

export const DepositButton: React.FC<DepositButtonProps> = ({
  carId,
  quantity = 1,
  title = 'Đặt cọc',
  successTitle = 'Đã thêm',
  variant = 'primary',
  size = 'md',
  showIcon = true,
  directCheckout = false,
  onSuccess,
  style,
  textStyle,
  disabled = false,
}) => {
  const { user } = useAuthStore();
  const { addToCart } = useCartStore();

  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [isAuthModalVisible, setIsAuthModalVisible] = useState(false);

  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const successOpacity = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.94,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();
  };

  const handlePress = async () => {
    if (disabled || status === 'loading') return;

    // 1. If not authenticated, show sleek Auth Modal prompt
    if (!user) {
      setIsAuthModalVisible(true);
      return;
    }

    // 2. Perform add to cart with animated state
    setStatus('loading');
    try {
      await addToCart(user.id, carId, quantity);
      setStatus('success');
      onSuccess?.();

      if (directCheckout) {
        router.push('/checkout' as any);
        return;
      }

      // Revert back to idle after 1.8 seconds
      setTimeout(() => {
        setStatus('idle');
      }, 1800);
    } catch (err: any) {
      console.warn('[DepositButton] Error adding car to cart:', err);
      setStatus('idle');
    }
  };

  const handleGoToLogin = () => {
    setIsAuthModalVisible(false);
    router.push('/(auth)/login' as any);
  };

  const isSuccess = status === 'success';
  const isLoading = status === 'loading';

  // Sizing styles
  const sizeStyles = {
    sm: { paddingVertical: 6, paddingHorizontal: 10, fontSize: 11, iconSize: 12 },
    md: { paddingVertical: 10, paddingHorizontal: 16, fontSize: 12, iconSize: 14 },
    lg: { paddingVertical: 14, paddingHorizontal: 20, fontSize: 14, iconSize: 16 },
  }[size];

  return (
    <>
      <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
          disabled={disabled || isLoading}
          style={[
            styles.baseButton,
            variant === 'primary' && styles.primaryButton,
            variant === 'secondary' && styles.secondaryButton,
            variant === 'outline' && styles.outlineButton,
            variant === 'pill' && styles.pillButton,
            variant === 'mini' && styles.miniButton,
            isSuccess && styles.successButton,
            {
              paddingVertical: variant === 'mini' ? 4 : sizeStyles.paddingVertical,
              paddingHorizontal: variant === 'mini' ? 8 : sizeStyles.paddingHorizontal,
            },
            disabled && styles.disabledButton,
          ]}
        >
          {isLoading ? (
            <ActivityIndicator
              size="small"
              color={variant === 'outline' ? colors.primaryHover : '#FFFFFF'}
            />
          ) : isSuccess ? (
            <View style={styles.contentRow}>
              <Ionicons name="checkmark-circle" size={sizeStyles.iconSize + 2} color="#FFFFFF" />
              <Text style={[styles.successText, { fontSize: sizeStyles.fontSize }]}>
                {successTitle}
              </Text>
            </View>
          ) : (
            <View style={styles.contentRow}>
              {showIcon && (
                <Ionicons
                  name={variant === 'outline' ? 'flash-outline' : 'flash'}
                  size={sizeStyles.iconSize}
                  color={
                    variant === 'outline' || variant === 'secondary'
                      ? colors.primaryHover
                      : '#FFFFFF'
                  }
                />
              )}
              <Text
                style={[
                  styles.buttonText,
                  variant === 'primary' && styles.primaryText,
                  variant === 'secondary' && styles.secondaryText,
                  variant === 'outline' && styles.outlineText,
                  variant === 'pill' && styles.pillText,
                  variant === 'mini' && styles.miniText,
                  { fontSize: sizeStyles.fontSize },
                  textStyle,
                ]}
              >
                {title}
              </Text>
            </View>
          )}
        </Pressable>
      </Animated.View>

      {/* Auth Prompt Modal for unauthenticated users */}
      <ModalSheet
        visible={isAuthModalVisible}
        onClose={() => setIsAuthModalVisible(false)}
        title="Yêu Cầu Đăng Nhập"
        subtitle="Để bảo đảm quyền lợi đặt cọc & tạo hợp đồng điện tử"
      >
        <View style={styles.authModalContent}>
          <View style={styles.authIconCircle}>
            <Ionicons name="shield-checkmark" size={32} color={colors.primaryHover} />
          </View>
          <Text style={styles.authModalTitle}>Đăng nhập để đặt cọc xe</Text>
          <Text style={styles.authModalDesc}>
            Khoản đặt cọc giữ chỗ và hồ sơ xe của bạn sẽ được bảo mật, liên kết trực tiếp với tài khoản cá nhân.
          </Text>

          <View style={styles.authModalActions}>
            <Button
              title="Để sau"
              variant="outline"
              size="md"
              onPress={() => setIsAuthModalVisible(false)}
              style={{ flex: 1 }}
            />
            <Button
              title="Đăng Nhập Ngay"
              variant="primary"
              size="md"
              onPress={handleGoToLogin}
              style={{ flex: 1 }}
              icon={<Ionicons name="log-in-outline" size={16} color="#FFFFFF" />}
            />
          </View>
        </View>
      </ModalSheet>
    </>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.surfaceElevated,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderColor: colors.primary,
  },
  pillButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    borderRadius: radii.full,
  },
  miniButton: {
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    borderColor: 'rgba(37, 99, 235, 0.3)',
    borderRadius: radii.xs,
  },
  successButton: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    fontWeight: typography.weights.semibold,
    letterSpacing: 0.1,
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: colors.text,
  },
  outlineText: {
    color: colors.primaryHover,
  },
  pillText: {
    color: '#FFFFFF',
    fontWeight: typography.weights.bold,
  },
  miniText: {
    color: colors.primaryHover,
    fontWeight: typography.weights.semibold,
  },
  successText: {
    color: '#FFFFFF',
    fontWeight: typography.weights.bold,
  },
  authModalContent: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  authIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  authModalTitle: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xs,
  },
  authModalDesc: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 320,
    marginBottom: spacing.xl,
  },
  authModalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
});
