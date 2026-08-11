import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../src/theme/colors';

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
            fontWeight: '700',
          },
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="car/[id]"
          options={{ title: 'Chi Tiết Xe', headerBackTitle: 'Quay lại' }}
        />
        <Stack.Screen
          name="checkout"
          options={{ title: 'Thanh Toán ZaloPay', headerBackTitle: 'Quay lại' }}
        />
        <Stack.Screen
          name="orders"
          options={{ title: 'Đơn Hàng Của Tôi', headerBackTitle: 'Quay lại' }}
        />
        <Stack.Screen
          name="order/[id]"
          options={{ title: 'Chi Tiết Đơn Hàng', headerBackTitle: 'Danh sách' }}
        />
      </Stack>
    </>
  );
}
