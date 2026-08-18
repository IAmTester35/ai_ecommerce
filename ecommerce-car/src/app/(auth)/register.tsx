import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, radii, spacing, typography, shadows } from '../../theme';
import { useAuthStore } from '../../store/useAuthStore';
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
  const [agreeTerms, setAgreeTerms] = useState(true);

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
      setFullNameError('Vui lòng nhập họ và tên của bạn.');
      isValid = false;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError('Vui lòng nhập địa chỉ email.');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
      setEmailError('Địa chỉ email không hợp lệ.');
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
      setPasswordError('Mật khẩu phải chứa ít nhất 6 ký tự.');
      isValid = false;
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Vui lòng xác nhận lại mật khẩu.');
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Mật khẩu xác nhận không khớp.');
      isValid = false;
    }

    if (!agreeTerms) {
      Alert.alert('Điều khoản', 'Vui lòng đồng ý với Điều khoản dịch vụ và Chính sách của AutoMatch.');
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
        Alert.alert(
          'Đăng ký thành công',
          'Vui lòng kiểm tra email và nhấp vào liên kết kích hoạt để hoàn tất đăng ký.',
          [
            {
              text: 'Đăng nhập',
              onPress: () => router.replace('/(auth)/login' as any),
            },
          ]
        );
      } else {
        Alert.alert(
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
            onPress={() => router.push('/(auth)/login' as any)}
          >
            <Text style={styles.loginLinkText}>Đăng nhập</Text>
          </TouchableOpacity>
        </View>

        {/* Brand Header */}
        <View style={styles.brandContainer}>
          <View style={styles.badgeRow}>
            <Badge label="GIA NHẬP HỆ THỐNG" variant="primary" size="xs" />
          </View>
          <Text style={styles.screenTitle}>Tạo Tài Khoản</Text>
          <Text style={styles.screenSubtitle}>
            Trải nghiệm nền tảng mua sắm ô tô kỹ thuật số & tư vấn AI thông minh
          </Text>
        </View>

        {/* Main Form Card */}
        <View style={styles.card}>
          {/* Error Banner */}
          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color={colors.danger} style={{ marginRight: 6 }} />
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
              <Ionicons name="person-outline" size={18} color={colors.textSecondary} />
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
              <Ionicons name="mail-outline" size={18} color={colors.textSecondary} />
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
              <Ionicons name="call-outline" size={18} color={colors.textSecondary} />
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
              <Ionicons name="shield-checkmark-outline" size={18} color={colors.textSecondary} />
            }
            rightIcon={
              <Ionicons
                name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
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
              size={18}
              color={agreeTerms ? colors.primaryHover : colors.textMuted}
              style={{ marginRight: spacing.sm, marginTop: 1 }}
            />
            <Text style={styles.termsText}>
              Tôi đồng ý với{' '}
              <Text style={styles.termsHighlight}>Điều khoản dịch vụ</Text> và{' '}
              <Text style={styles.termsHighlight}>Chính sách bảo mật</Text> của AutoMatch AI.
            </Text>
          </TouchableOpacity>

          {/* Submit Button */}
          <Button
            title="Đăng Ký Tài Khoản"
            size="lg"
            variant="primary"
            loading={isLoading}
            onPress={handleRegister}
            iconRight={<Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />}
            style={styles.submitBtn}
          />
        </View>

        {/* Footer Navigation */}
        <View style={styles.footerRow}>
          <Text style={styles.footerPrompt}>Đã có tài khoản AutoMatch?</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/(auth)/login' as any)}
          >
            <Text style={styles.footerLink}>Đăng nhập ngay</Text>
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
    marginBottom: spacing.sm,
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
  loginLinkText: {
    color: colors.primaryHover,
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.semibold,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  badgeRow: {
    marginBottom: spacing.xs,
  },
  screenTitle: {
    color: colors.text,
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    letterSpacing: -0.3,
  },
  screenSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: spacing.md,
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.md,
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
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    paddingHorizontal: 2,
  },
  termsText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    lineHeight: 18,
    flex: 1,
  },
  termsHighlight: {
    color: colors.primaryHover,
    fontWeight: typography.weights.medium,
  },
  submitBtn: {
    marginTop: spacing.xs,
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
