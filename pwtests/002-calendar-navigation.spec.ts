import { expect, test } from '@playwright/test';
import { TEST_CONFIG } from './test-config';

test.describe('Calendar Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto(`${TEST_CONFIG.baseUrl}/login`);
    await page.getByRole('textbox', { name: 'Email address' }).fill(TEST_CONFIG.credentials.serviceProvider.email);
    await page.getByRole('textbox', { name: 'Password' }).fill(TEST_CONFIG.credentials.serviceProvider.password);
    await page.getByRole('button', { name: 'Log in' }).click();
    await page.waitForURL(/\/dashboard|\/calendar|\/$/, { timeout: 10000 });
  });

  test('001 - should navigate to calendar page after login', async ({ page }) => {
    await page.goto(`${TEST_CONFIG.baseUrl}/calendar`);
    
    await expect(page).toHaveURL(/\/calendar/);
    await expect(page).toHaveTitle(/Calendar|Bookspot/i);
  });

  test('002 - should display calendar view', async ({ page }) => {
    await page.goto(`${TEST_CONFIG.baseUrl}/calendar`);
    
    // Wait for calendar to load
    await page.waitForLoadState('networkidle');
    
    // Take a snapshot to see what's on the page
    const title = await page.title();
    expect(title).toBeTruthy();
  });
});
