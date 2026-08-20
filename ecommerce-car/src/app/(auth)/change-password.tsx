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
      setPasswordError('Mật khẩu tối thiểu 6 ký tự.');
      isValid = false;
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Vui lòng xác nhận mật khẩu mới.');
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Mật khẩu xác nhận không khớp.');
      isValid = false;
    }

    return isValid;
  };

  const handleChangePassword = async () => {
    if (!validateForm()) return;

    try {
      await updatePassword(password);
      globalAlert(
        'Thành công',
        'Mật khẩu của bạn đã được cập nhật.',
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
                router.replace('/(tabs)/profile' as any);
              }
            }}
          >
            <Ionicons name="arrow-back" size={16} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.headerBox}>
          <View style={styles.iconCircle}>
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.primaryHover} />
          </View>
          <Text style={styles.title}>Thiết Lập Mật Khẩu</Text>
          <Text style={styles.subtitle}>
            Tạo mật khẩu với ít nhất 6 ký tự để bảo vệ tài khoản
          </Text>
        </View>

        <View style={styles.card}>
          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={14} color={colors.danger} style={{ marginRight: 5 }} />
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
              <Ionicons name="lock-closed-outline" size={15} color={colors.textSecondary} />
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

          <Button
            title="Lưu Mật Khẩu Mới"
            size="sm"
            variant="primary"
            loading={isLoading}
            onPress={handleChangePassword}
            style={styles.submitBtn}
          />
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
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
    paddingBottom: spacing.lg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginTop: spacing.sm,
    height: 40,
  },
});
