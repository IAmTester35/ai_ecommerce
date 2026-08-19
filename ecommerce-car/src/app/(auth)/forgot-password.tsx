import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, radii, spacing, typography } from '../../theme';
import { useAuthStore } from '../../store/useAuthStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

export default function ForgotPasswordScreen() {
  const { resetPassword, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const validateForm = () => {
    setEmailError('');
    clearError();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError('Vui lòng nhập địa chỉ email.');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
      setEmailError('Địa chỉ email không hợp lệ.');
      return false;
    }
    return true;
  };

  const handleResetPassword = async () => {
    if (!validateForm()) return;

    try {
      await resetPassword(email.trim());
      setIsSuccess(true);
      setCountdown(60);
    } catch {
      // Error is stored in useAuthStore
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top Navigation Bar with Back Button */}
        <View style={styles.topBar}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.backButton}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(auth)/login' as any);
              }
            }}
          >
            <Ionicons name="arrow-back" size={16} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.replace('/(auth)/login' as any)}
          >
            <Text style={styles.loginLinkText}>Đăng nhập</Text>
          </TouchableOpacity>
        </View>

        {/* Brand/Feature Icon */}
        <View style={styles.headerBox}>
          <View style={styles.iconCircle}>
            <Ionicons name="key-outline" size={22} color={colors.primaryHover} />
          </View>
          <Text style={styles.title}>Quên Mật Khẩu?</Text>
          <Text style={styles.subtitle}>
            Nhập email tài khoản để nhận liên kết thiết lập lại mật khẩu
          </Text>
        </View>

        {isSuccess ? (
          /* Success Result Card */
          <Card style={styles.successCard}>
            <View style={styles.successIconWrapper}>
              <Ionicons name="mail-unread-outline" size={28} color={colors.success} />
            </View>
            <Text style={styles.successTitle}>Đã Gửi Email Khôi Phục</Text>
            <Text style={styles.successDesc}>
              Liên kết đã gửi tới{' '}
              <Text style={styles.emailHighlight}>{email.trim()}</Text>. Vui lòng kiểm tra hộp thư đến.
            </Text>

            <View style={styles.successActions}>
              <Button
                title="Quay lại Đăng nhập"
                size="sm"
                variant="primary"
                onPress={() => router.replace('/(auth)/login' as any)}
                fullWidth
                style={{ marginBottom: spacing.xs }}
              />

              <Button
                title={countdown > 0 ? `Gửi lại sau (${countdown}s)` : 'Gửi lại mã'}
                size="sm"
                variant="ghost"
                disabled={countdown > 0 || isLoading}
                onPress={handleResetPassword}
                fullWidth
              />
            </View>
          </Card>
        ) : (
          /* Request Form Card */
          <View style={styles.card}>
            {/* Error Banner */}
            {error ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={14} color={colors.danger} style={{ marginRight: 5 }} />
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            ) : null}

            <Input
              label="Địa chỉ Email"
              required
              placeholder="name@example.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (emailError) setEmailError('');
                if (error) clearError();
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={emailError}
              leftIcon={
                <Ionicons name="mail-outline" size={15} color={colors.textSecondary} />
              }
              helperText="Hệ thống sẽ gửi liên kết an toàn đến email này."
            />

            <Button
              title="Gửi Yêu Cầu Khôi Phục"
              size="sm"
              variant="primary"
              loading={isLoading}
              onPress={handleResetPassword}
              iconRight={<Ionicons name="paper-plane-outline" size={14} color="#FFFFFF" />}
              style={styles.submitBtn}
            />

            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.backToLoginRow}
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/(auth)/login' as any);
                }
              }}
            >
              <Ionicons name="arrow-back" size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
              <Text style={styles.backToLoginText}>Quay lại Đăng nhập</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: spacing.lg }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
    paddingBottom: spacing.lg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  loginLinkText: {
    color: colors.primaryHover,
    fontSize: 12,
    fontWeight: typography.weights.semibold,
  },
  headerBox: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs + 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  title: {
    color: colors.text,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    lineHeight: 22,
    marginBottom: 4,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: spacing.md,
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerMuted,
    borderRadius: radii.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorBannerText: {
    color: colors.danger,
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },
  submitBtn: {
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    height: 40,
  },
  backToLoginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  backToLoginText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: typography.weights.medium,
  },
  successCard: {
    padding: spacing.lg,
    borderRadius: radii.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  successIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: radii.full,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  successTitle: {
    color: colors.text,
    fontSize: typography.sizes.sm + 1,
    fontWeight: typography.weights.bold,
    lineHeight: 20,
    marginBottom: 4,
  },
  successDesc: {
    color: colors.textSecondary,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: spacing.lg,
  },
  emailHighlight: {
    color: colors.text,
    fontWeight: typography.weights.semibold,
  },
  successActions: {
    width: '100%',
  },
});
