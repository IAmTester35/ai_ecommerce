import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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

export default function ChangePasswordScreen() {
  const { updatePassword, isLoading, error, clearError } = useAuthStore();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const validateForm = () => {
    let isValid = true;
    setPasswordError('');
    setConfirmPasswordError('');
    clearError();

    if (!password) {
      setPasswordError('Vui lòng nhập mật khẩu mới.');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      isValid = false;
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Vui lòng xác nhận lại mật khẩu mới.');
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Mật khẩu xác nhận không trùng khớp.');
      isValid = false;
    }

    return isValid;
  };

  const handleChangePassword = async () => {
    if (!validateForm()) return;

    try {
      await updatePassword(password);
      Alert.alert(
        'Thành công',
        'Mật khẩu của bạn đã được cập nhật thành công.',
        [
          {
            text: 'Đóng',
            onPress: () => router.back(),
          },
        ]
      );
    } catch {
      // Error handled by store
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
        <View style={styles.headerBox}>
          <View style={styles.iconCircle}>
            <Ionicons name="shield-checkmark-outline" size={26} color={colors.primaryHover} />
          </View>
          <Text style={styles.title}>Thiết Lập Mật Khẩu</Text>
          <Text style={styles.subtitle}>
            Tạo mật khẩu mạnh với ít nhất 6 ký tự để bảo vệ tài khoản AutoMatch của bạn
          </Text>
        </View>

        <View style={styles.card}>
          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color={colors.danger} style={{ marginRight: 6 }} />
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          ) : null}

          <Input
            label="Mật khẩu mới"
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

          <Input
            label="Xác nhận mật khẩu mới"
            required
            placeholder="Nhập lại mật khẩu mới"
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
              <Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} />
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

          <Button
            title="Lưu Mật Khẩu Mới"
            size="lg"
            variant="primary"
            loading={isLoading}
            onPress={handleChangePassword}
            style={styles.submitBtn}
          />
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
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  headerBox: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.borderHighlight,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    ...shadows.glowCyan,
  },
  title: {
    color: colors.text,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginBottom: 4,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
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
  submitBtn: {
    marginTop: spacing.sm,
  },
});
