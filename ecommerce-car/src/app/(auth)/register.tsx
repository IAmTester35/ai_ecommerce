import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, radii, spacing, typography } from '../../theme';
import { useAuthStore } from '../../store/useAuthStore';
import { globalAlert } from '../../store/useDialogStore';
import { ResponsiveContainer } from '../../components/ui/ResponsiveContainer';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export default function RegisterScreen() {
  const { signUp, isLoading, error, clearError } = useAuthStore();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [fullNameError, setFullNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const validateForm = () => {
    let isValid = true;
    setFullNameError('');
    setEmailError('');
    setPhoneError('');
    setPasswordError('');
    setConfirmPasswordError('');
    clearError();

    if (!fullName.trim()) {
      setFullNameError('Vui lòng nhập họ và tên.');
      isValid = false;
    }

    if (!email.trim()) {
      setEmailError('Vui lòng nhập email.');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError('Email không hợp lệ.');
      isValid = false;
    }

    if (phone.trim() && !/^[0-9+ ]{9,15}$/.test(phone.trim())) {
      setPhoneError('Số điện thoại không đúng định dạng.');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Vui lòng nhập mật khẩu.');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Mật khẩu tối thiểu 6 ký tự.');
      isValid = false;
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Vui lòng xác nhận mật khẩu.');
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Mật khẩu xác nhận không khớp.');
      isValid = false;
    }

    if (!agreeTerms) {
      globalAlert('Điều khoản', 'Vui lòng đồng ý với Điều khoản dịch vụ.');
      isValid = false;
    }

    return isValid;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      const { needEmailConfirmation } = await signUp(
        email.trim(),
        password,
        fullName.trim(),
        phone.trim() || undefined
      );

      if (needEmailConfirmation) {
        globalAlert(
          'Đăng ký thành công',
          'Vui lòng kiểm tra email kích hoạt tài khoản.',
          [
            {
              text: 'Đăng nhập',
              onPress: () => router.replace('/(auth)/login' as any),
            },
          ]
        );
      } else {
        globalAlert(
          'Chào mừng bạn!',
          'Tài khoản của bạn đã được khởi tạo thành công.',
          [
            {
              text: 'Bắt đầu',
              onPress: () => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/(tabs)/profile' as any);
                }
              },
            },
          ]
        );
      }
    } catch {
      // Error is set in store and displayed in banner
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ResponsiveContainer
        scrollable
        maxWidth="sm"
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
            <Ionicons name="arrow-back" size={16} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.replace('/(auth)/login' as any)}
          >
            <Text style={styles.loginLinkText}>Đăng nhập</Text>
          </TouchableOpacity>
        </View>

        {/* Brand Header */}
        <View style={styles.brandContainer}>
          <View style={styles.badgeRow}>
            <Badge label="GIA NHẬP" variant="primary" size="xs" />
          </View>
          <Text style={styles.screenTitle}>Tạo Tài Khoản</Text>
          <Text style={styles.screenSubtitle}>
            Nền tảng mua sắm ô tô & tư vấn AI thông minh
          </Text>
        </View>

        {/* Main Form Card */}
        <View style={styles.card}>
          {/* Error Banner */}
          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={14} color={colors.danger} style={{ marginRight: 5 }} />
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          ) : null}

          {/* Full Name Input */}
          <Input
            label="Họ và tên"
            required
            placeholder="Nguyễn Văn A"
            value={fullName}
            onChangeText={(text) => {
              setFullName(text);
              if (fullNameError) setFullNameError('');
              if (error) clearError();
            }}
            autoCapitalize="words"
            error={fullNameError}
            leftIcon={
              <Ionicons name="person-outline" size={15} color={colors.textSecondary} />
            }
          />

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
              <Ionicons name="mail-outline" size={15} color={colors.textSecondary} />
            }
          />

          {/* Phone Input */}
          <Input
            label="Số điện thoại"
            placeholder="0912 345 678 (Tùy chọn)"
            value={phone}
            onChangeText={(text) => {
              setPhone(text);
              if (phoneError) setPhoneError('');
              if (error) clearError();
            }}
            keyboardType="phone-pad"
            error={phoneError}
            leftIcon={
              <Ionicons name="call-outline" size={15} color={colors.textSecondary} />
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
              <Ionicons name="lock-closed-outline" size={15} color={colors.textSecondary} />
            }
            rightIcon={
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={15}
                color={colors.textSecondary}
              />
            }
            onRightIconPress={() => setShowPassword((prev) => !prev)}
          />

          {/* Confirm Password Input */}
          <Input
            label="Xác nhận mật khẩu"
            required
            placeholder="Nhập lại mật khẩu"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (confirmPasswordError) setConfirmPasswordError('');
              if (error) clearError();
            }}
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
            error={confirmPasswordError}
            leftIcon={
              <Ionicons name="shield-checkmark-outline" size={15} color={colors.textSecondary} />
            }
            rightIcon={
              <Ionicons
                name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                size={15}
                color={colors.textSecondary}
              />
            }
            onRightIconPress={() => setShowConfirmPassword((prev) => !prev)}
          />

          {/* Terms Agreement Checkbox */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.termsRow}
            onPress={() => setAgreeTerms((prev) => !prev)}
          >
            <Ionicons
              name={agreeTerms ? 'checkbox' : 'square-outline'}
              size={15}
              color={agreeTerms ? colors.primaryHover : colors.textMuted}
              style={{ marginRight: spacing.xs + 2, marginTop: 1 }}
            />
            <Text style={styles.termsText}>
              Tôi đồng ý với{' '}
              <Text style={styles.termsHighlight}>Điều khoản</Text> và{' '}
              <Text style={styles.termsHighlight}>Chính sách</Text> của AutoMatch.
            </Text>
          </TouchableOpacity>

          {/* Submit Button */}
          <Button
            title="Đăng Ký Tài Khoản"
            size="sm"
            variant="primary"
            loading={isLoading}
            onPress={handleRegister}
            iconRight={<Ionicons name="checkmark-circle-outline" size={15} color="#FFFFFF" />}
            style={styles.submitBtn}
          />
        </View>

        {/* Footer Navigation */}
        <View style={styles.footerRow}>
          <Text style={styles.footerPrompt}>Đã có tài khoản?</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.replace('/(auth)/login' as any)}
          >
            <Text style={styles.footerLink}>Đăng nhập</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: spacing.lg }} />
      </ResponsiveContainer>
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
    paddingBottom: spacing.lg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs + 2,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  loginLinkText: {
    color: colors.primaryHover,
    fontSize: 11,
    fontWeight: typography.weights.semibold,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  badgeRow: {
    marginBottom: 4,
  },
  screenTitle: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    lineHeight: 24,
  },
  screenSubtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
    lineHeight: 16,
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
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  termsText: {
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 15,
    flex: 1,
  },
  termsHighlight: {
    color: colors.primaryHover,
    fontWeight: typography.weights.medium,
  },
  submitBtn: {
    marginTop: 2,
    height: 40,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    marginTop: spacing.lg,
  },
  footerPrompt: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  footerLink: {
    color: colors.primaryHover,
    fontSize: 11,
    fontWeight: typography.weights.bold,
  },
});
