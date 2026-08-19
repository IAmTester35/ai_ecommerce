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
import { Badge } from '../../components/ui/Badge';

export default function EditProfileScreen() {
  const { user, profile, updateProfile, isLoading, error, clearError } = useAuthStore();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const userInitials = (fullName || profile?.full_name || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const validateForm = () => {
    let isValid = true;
    setNameError('');
    setPhoneError('');
    clearError();

    if (!fullName.trim()) {
      setNameError('Vui lòng nhập họ và tên.');
      isValid = false;
    }

    if (phone.trim() && !/^[0-9+ ]{9,15}$/.test(phone.trim())) {
      setPhoneError('Số điện thoại không đúng định dạng.');
      isValid = false;
    }

    return isValid;
  };

  const handleSaveProfile = async () => {
    if (!validateForm()) return;

    try {
      await updateProfile({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
      });

      Alert.alert(
        'Đã cập nhật',
        'Thông tin hồ sơ của bạn đã được cập nhật thành công.',
        [
          {
            text: 'Xong',
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
        {/* Avatar Presentation */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{userInitials}</Text>
          </View>
          <Text style={styles.avatarName}>{fullName || 'Khách hàng'}</Text>
          <View style={styles.roleBadgeRow}>
            <Badge
              label={
                profile?.role === 'owner'
                  ? 'Chủ Showroom'
                  : profile?.role === 'manager'
                    ? 'Quản Lý'
                    : 'Thành Viên'
              }
              variant={profile?.role === 'owner' ? 'gold' : 'primary'}
              size="xs"
            />
          </View>
        </View>

        {/* Edit Form Card */}
        <View style={styles.card}>
          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color={colors.danger} style={{ marginRight: 6 }} />
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          ) : null}

          {/* Readonly Email */}
          <Input
            label="Địa chỉ Email"
            value={user?.email || profile?.email || ''}
            editable={false}
            helperText="Email được gắn liền với tài khoản Supabase và không thể đổi trực tiếp."
            leftIcon={
              <Ionicons name="mail-outline" size={18} color={colors.textMuted} />
            }
          />

          {/* Full Name */}
          <Input
            label="Họ và tên"
            required
            placeholder="Nhập họ và tên của bạn"
            value={fullName}
            onChangeText={(text) => {
              setFullName(text);
              if (nameError) setNameError('');
              if (error) clearError();
            }}
            error={nameError}
            leftIcon={
              <Ionicons name="person-outline" size={18} color={colors.textSecondary} />
            }
          />

          {/* Phone Number */}
          <Input
            label="Số điện thoại liên hệ"
            placeholder="0912 345 678"
            value={phone}
            onChangeText={(text) => {
              setPhone(text);
              if (phoneError) setPhoneError('');
              if (error) clearError();
            }}
            keyboardType="phone-pad"
            error={phoneError}
            helperText="Dùng để showroom liên hệ khi bạn đặt lịch lái thử hoặc cọc xe."
            leftIcon={
              <Ionicons name="call-outline" size={18} color={colors.textSecondary} />
            }
          />

          <Button
            title="Lưu Thay Đổi"
            size="lg"
            variant="primary"
            loading={isLoading}
            onPress={handleSaveProfile}
            iconRight={<Ionicons name="checkmark-outline" size={18} color="#FFFFFF" />}
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
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.xl,
    paddingBottom: spacing['2xl'],
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  avatarCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    ...shadows.glowCyan,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  avatarName: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    lineHeight: 24,
    marginBottom: 4,
  },
  roleBadgeRow: {
    marginTop: 4,
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
  },
});
