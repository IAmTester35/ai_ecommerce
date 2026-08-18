import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors, typography } from '../theme';

export default function RootLayout() {
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
