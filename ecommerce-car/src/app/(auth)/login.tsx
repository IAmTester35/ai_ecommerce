import React, { useState } from 'react';
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
import { Badge } from '../../components/ui/Badge';

export default function LoginScreen() {
  const { signIn, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateForm = () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');
    clearError();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError('Vui lòng nhập địa chỉ email.');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
      setEmailError('Địa chỉ email không đúng định dạng.');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Vui lòng nhập mật khẩu.');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Mật khẩu phải chứa ít nhất 6 ký tự.');
      isValid = false;
    }

    return isValid;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      await signIn(email.trim(), password);
      // If we can go back, go back; otherwise go to tabs profile
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/profile' as any);
      }
    } catch {
      // Error is set in store and displayed in banner
    }
  };

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setEmailError('');
    setPasswordError('');
    clearError();
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
                router.replace('/(tabs)/' as any);
              }
            }}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.replace('/(tabs)/' as any)}
          >
            <Text style={styles.guestButtonText}>Khám phá</Text>
          </TouchableOpacity>
        </View>

        {/* Brand Header */}
        <View style={styles.brandContainer}>
          <View style={styles.logoIconWrapper}>
            <Ionicons name="speedometer-outline" size={32} color={colors.primary} />
          </View>
          <View style={styles.brandTitleRow}>
            <Text style={styles.brandTitle}>AUTOMATCH</Text>
            <Badge label="AI LUXURY" variant="primary" size="xs" />
          </View>
          <Text style={styles.brandSubtitle}>
            Hệ thống Thương Mại & Tư Vấn Xe Hơi Kỹ Thuật Số
          </Text>
        </View>

        {/* Main Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Đăng Nhập Tài Khoản</Text>
            <Text style={styles.cardDescription}>
              Truy cập để quản lý đơn đặt cọc, lịch lái thử và gara cá nhân
            </Text>
          </View>

          {/* Error Banner */}
          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color={colors.danger} style={{ marginRight: 6 }} />
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          ) : null}

          {/* Email Input */}
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
              <Ionicons name="mail-outline" size={18} color={colors.textSecondary} />
            }
          />

          {/* Password Input */}
          <Input
            label="Mật khẩu"
            required
            placeholder="Tối thiểu 6 ký tự"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (passwordError) setPasswordError('');
              if (error) clearError();
            }}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            error={passwordError}
            leftIcon={
              <Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} />
            }
            rightIcon={
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={colors.textSecondary}
              />
            }
            onRightIconPress={() => setShowPassword((prev) => !prev)}
          />

          {/* Forgot Password Row */}
          <View style={styles.forgotRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/(auth)/forgot-password' as any)}
            >
              <Text style={styles.forgotText}>Quên mật khẩu?</Text>
            </TouchableOpacity>
          </View>

          {/* Submit Button */}
          <Button
            title="Đăng Nhập"
            size="lg"
            variant="primary"
            loading={isLoading}
            onPress={handleLogin}
            iconRight={<Ionicons name="arrow-forward" size={16} color="#FFFFFF" />}
            style={styles.submitBtn}
          />

          {/* Quick Demo Helper for instant testing */}
          <View style={styles.demoBox}>
            <Text style={styles.demoLabel}>Mẫu kiểm thử nhanh:</Text>
            <View style={styles.demoChips}>
              <TouchableOpacity
                style={styles.demoChip}
                onPress={() => handleQuickFill('demo@automatch.ai', '123456')}
              >
                <Ionicons name="flash-outline" size={12} color={colors.primaryHover} />
                <Text style={styles.demoChipText}>Tài khoản Demo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.demoChip}
                onPress={() => handleQuickFill('khachhang@gmail.com', '123456')}
              >
                <Ionicons name="person-outline" size={12} color={colors.textSecondary} />
                <Text style={styles.demoChipText}>Khách hàng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Footer Navigation */}
        <View style={styles.footerRow}>
          <Text style={styles.footerPrompt}>Chưa có tài khoản AutoMatch?</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/(auth)/register' as any)}
          >
            <Text style={styles.footerLink}>Đăng ký ngay</Text>
          </TouchableOpacity>
        </View>

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
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 48 : 36,
    paddingBottom: spacing.xl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestButtonText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.medium,
  },
  brandContainer: {
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  logoIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.borderHighlight,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    ...shadows.glowCyan,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  brandTitle: {
    color: colors.text,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    letterSpacing: 2,
  },
  brandSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.md,
  },
  cardHeader: {
    marginBottom: spacing.md,
  },
  cardTitle: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    marginBottom: 4,
  },
  cardDescription: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    lineHeight: 18,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerMuted,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  errorBannerText: {
    color: colors.danger,
    fontSize: typography.sizes.xs,
    flex: 1,
    lineHeight: 16,
  },
  forgotRow: {
    alignItems: 'flex-end',
    marginBottom: spacing.md,
    marginTop: -2,
  },
  forgotText: {
    color: colors.primaryHover,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  submitBtn: {
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  demoBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: colors.borderLight,
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: spacing.sm + 2,
    marginTop: spacing.xs,
  },
  demoLabel: {
    color: colors.textMuted,
    fontSize: typography.sizes['2xs'],
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  demoChips: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  demoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radii.sm,
  },
  demoChipText: {
    color: colors.textSecondary,
    fontSize: typography.sizes['2xs'] + 1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.xl,
  },
  footerPrompt: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
  },
  footerLink: {
    color: colors.primaryHover,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
});
