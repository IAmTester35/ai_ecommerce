import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors, typography } from '../theme';
import { useAuthStore } from '../store/useAuthStore';

export default function RootLayout() {
  const { initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: typography.weights.bold,
          },
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="(auth)"
          options={{
            headerShown: false,
            animation: 'slide_from_bottom',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="car/[id]"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="cart"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="checkout"
          options={{ title: 'Thanh Toán Đặt Cọc', headerBackTitle: 'Quay lại' }}
        />
        <Stack.Screen
          name="orders"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="order/[id]"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="notifications"
          options={{ headerShown: false }}
        />
      </Stack>
    </>
  );
}

