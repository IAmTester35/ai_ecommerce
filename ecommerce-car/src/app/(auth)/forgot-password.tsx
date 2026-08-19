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
import { colors, radii, spacing, typography, shadows } from '../../theme';
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
        {/* Brand/Feature Icon */}
        <View style={styles.headerBox}>
          <View style={styles.iconCircle}>
            <Ionicons name="key-outline" size={28} color={colors.primaryHover} />
          </View>
          <Text style={styles.title}>Quên Mật Khẩu?</Text>
          <Text style={styles.subtitle}>
            Nhập email tài khoản của bạn để nhận liên kết hướng dẫn thiết lập lại mật khẩu mới
          </Text>
        </View>

        {isSuccess ? (
          /* Success Result Card */
          <Card style={styles.successCard}>
            <View style={styles.successIconWrapper}>
              <Ionicons name="mail-unread-outline" size={36} color={colors.success} />
            </View>
            <Text style={styles.successTitle}>Đã Gửi Email Khôi Phục!</Text>
            <Text style={styles.successDesc}>
              Liên kết đặt lại mật khẩu đã được gửi đến{' '}
              <Text style={styles.emailHighlight}>{email.trim()}</Text>. Vui lòng kiểm tra hộp thư đến hoặc mục thư rác.
            </Text>

            <View style={styles.successActions}>
              <Button
                title="Quay lại Đăng nhập"
                size="md"
                variant="primary"
                onPress={() => router.replace('/(auth)/login' as any)}
                fullWidth
                style={{ marginBottom: spacing.sm }}
              />

              <Button
                title={countdown > 0 ? `Gửi lại sau (${countdown}s)` : 'Gửi lại mã'}
                size="md"
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
                <Ionicons name="alert-circle" size={16} color={colors.danger} style={{ marginRight: 6 }} />
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            ) : null}

            <Input
              label="Địa chỉ Email tài khoản"
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
                <Ionicons name="mail-outline" size={18} color={colors.textSecondary} />
              }
              helperText="Hệ thống sẽ gửi một liên kết an toàn đến địa chỉ email này."
            />

            <Button
              title="Gửi Yêu Cầu Khôi Phục"
              size="lg"
              variant="primary"
              loading={isLoading}
              onPress={handleResetPassword}
              iconRight={<Ionicons name="paper-plane-outline" size={16} color="#FFFFFF" />}
              style={styles.submitBtn}
            />

            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.backToLoginRow}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={14} color={colors.textSecondary} style={{ marginRight: 4 }} />
              <Text style={styles.backToLoginText}>Quay lại Đăng nhập</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: spacing['2xl'] }} />
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
    paddingHorizontal: spacing['2xl'],
    paddingTop: Platform.OS === 'ios' ? 52 : 40,
    paddingBottom: spacing['2xl'],
  },
  headerBox: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    ...shadows.glowCyan,
  },
  title: {
    color: colors.text,
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    lineHeight: 32,
    marginBottom: 6,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs + 1,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.md,
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.xl,
    padding: spacing.xl,
    ...shadows.md,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerMuted,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  errorBannerText: {
    color: colors.danger,
    fontSize: typography.sizes.xs,
    flex: 1,
    lineHeight: 18,
  },
  submitBtn: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  backToLoginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  backToLoginText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  successCard: {
    padding: spacing.xl,
    borderRadius: radii.xl,
    alignItems: 'center',
  },
  successIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: radii.full,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  successTitle: {
    color: colors.text,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    lineHeight: 28,
    marginBottom: 8,
  },
  successDesc: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs + 1,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing['2xl'],
  },
  emailHighlight: {
    color: colors.text,
    fontWeight: typography.weights.semibold,
  },
  successActions: {
    width: '100%',
  },
});
