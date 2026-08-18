import React from 'react';
import { Stack } from 'expo-router';
import { colors, typography } from '../../theme';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: typography.weights.bold,
          fontSize: typography.sizes.md,
        },
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen
        name="login"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="register"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="forgot-password"
        options={{
          title: 'Khôi Phục Mật Khẩu',
          headerShown: true,
          headerBackTitle: 'Đăng nhập',
        }}
      />
      <Stack.Screen
        name="reset-password"
        options={{
          title: 'Đặt Lại Mật Khẩu',
          headerShown: true,
          headerBackTitle: 'Quay lại',
        }}
      />
      <Stack.Screen
        name="change-password"
        options={{
          title: 'Đổi Mật Khẩu',
          headerShown: true,
          headerBackTitle: 'Tài khoản',
        }}
      />
      <Stack.Screen
        name="edit-profile"
        options={{
          title: 'Hồ Sơ Cá Nhân',
          headerShown: true,
          headerBackTitle: 'Quay lại',
        }}
      />
    </Stack>
  );
}
