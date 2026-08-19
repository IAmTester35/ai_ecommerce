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
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="reset-password"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="change-password"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="edit-profile"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
