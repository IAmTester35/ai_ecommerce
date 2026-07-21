import { test, expect } from '@playwright/test';

test.describe('AutoMatch AI Chat Interface', () => {
  
  test('should load the homepage and display initial AI message', async ({ page }) => {
    await page.goto('/');
    
    // Check if the title is correct
    await expect(page).toHaveTitle(/Next.js and Supabase Starter Kit|AutoMatch/);

    // Check header
    await expect(page.getByRole('heading', { name: 'AutoMatch AI' })).toBeVisible();

    // Check initial assistant greeting message
    await expect(page.getByText('Xin chào! Tôi là AutoMatch AI')).toBeVisible();

    // Check search box visibility
    await expect(page.getByPlaceholder(/Nhập nhu cầu của bạn/)).toBeVisible();
  });

  test('should show user query and loading state', async ({ page }) => {
    await page.goto('/');
    
    // Type a query
    const input = page.getByPlaceholder(/Nhập nhu cầu của bạn/);
    await input.fill('Tôi cần xe V12 đi dạo phố giá dưới 1 tỷ');
    
    // Press Enter or click send
    await input.press('Enter');

    // Verify user message appears
    await expect(page.getByText('Tôi cần xe V12 đi dạo phố giá dưới 1 tỷ').last()).toBeVisible();

    // Since the actual API might be slow or we are just testing UI loading, 
    // we can expect the input to be disabled during fetch
    await expect(input).toBeDisabled();
  });

  test('should mock backend API and show conflict warning', async ({ page }) => {
    // Intercept the API request and return mock data
    await page.route('http://127.0.0.1:8000/api/search', async route => {
      const json = {
        original_query: 'Tôi cần xe V12 đi dạo phố giá dưới 1 tỷ',
        constraints: {},
        results: [
          {
            id: 1,
            car_name: 'Mock Car V12',
            price: 1500000000, // 1.5 ty
            engine_type: 'V12',
            manufacturer: 'MockBrand',
            year: 2024,
            description: 'This is a mock car.'
          }
        ],
        conflict_detected: true,
        ai_message: 'Hệ thống đã điều chỉnh kết quả để phù hợp nhất.'
      };
      await route.fulfill({ json });
    });

    await page.goto('/');

    const input = page.getByPlaceholder(/Nhập nhu cầu của bạn/);
    await input.fill('Tôi cần xe V12 đi dạo phố giá dưới 1 tỷ');
    await input.press('Enter');

    // Verify the conflict warning is displayed
    await expect(page.getByText('Phát hiện mâu thuẫn yêu cầu')).toBeVisible();
    
    // Verify the AI message is displayed
    await expect(page.getByText('Hệ thống đã điều chỉnh kết quả để phù hợp nhất.')).toBeVisible();

    // Verify the mock car card is displayed
    await expect(page.getByText('Mock Car V12')).toBeVisible();
    await expect(page.getByText('MockBrand')).toBeVisible();
  });
});
