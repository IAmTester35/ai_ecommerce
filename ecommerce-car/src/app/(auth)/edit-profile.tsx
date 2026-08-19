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
import { colors, radii, spacing, typography } from '../../theme';
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
              <Ionicons name="alert-circle" size={14} color={colors.danger} style={{ marginRight: 5 }} />
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          ) : null}

          {/* Readonly Email */}
          <Input
            label="Địa chỉ Email"
            value={user?.email || profile?.email || ''}
            editable={false}
            helperText="Email liên kết với tài khoản và không thể đổi trực tiếp."
            leftIcon={
              <Ionicons name="mail-outline" size={15} color={colors.textMuted} />
            }
          />

          {/* Full Name */}
          <Input
            label="Họ và tên"
            required
            placeholder="Nhập họ và tên"
            value={fullName}
            onChangeText={(text) => {
              setFullName(text);
              if (nameError) setNameError('');
              if (error) clearError();
            }}
            error={nameError}
            leftIcon={
              <Ionicons name="person-outline" size={15} color={colors.textSecondary} />
            }
          />

          {/* Phone Number */}
          <Input
            label="Số điện thoại"
            placeholder="0912 345 678"
            value={phone}
            onChangeText={(text) => {
              setPhone(text);
              if (phoneError) setPhoneError('');
              if (error) clearError();
            }}
            keyboardType="phone-pad"
            error={phoneError}
            helperText="Dùng để liên hệ khi lái thử hoặc giữ xe."
            leftIcon={
              <Ionicons name="call-outline" size={15} color={colors.textSecondary} />
            }
          />

          <Button
            title="Lưu Thay Đổi"
            size="sm"
            variant="primary"
            loading={isLoading}
            onPress={handleSaveProfile}
            iconRight={<Ionicons name="checkmark-outline" size={15} color="#FFFFFF" />}
            style={styles.submitBtn}
          />
        </View>

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
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryHover,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs + 2,
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
  avatarName: {
    color: colors.text,
    fontSize: typography.sizes.sm + 1,
    fontWeight: typography.weights.bold,
    lineHeight: 20,
    marginBottom: 2,
  },
  roleBadgeRow: {
    marginTop: 2,
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
