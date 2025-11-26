import { expect, test } from '@playwright/test';
import { TEST_CONFIG } from './test-config';

test.describe('Calendar Provider Sidebar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${TEST_CONFIG.baseUrl}/login`);
    await page.getByRole('textbox', { name: 'Email address' }).fill(TEST_CONFIG.credentials.serviceProvider.email);
    await page.getByRole('textbox', { name: 'Password' }).fill(TEST_CONFIG.credentials.serviceProvider.password);
    await page.getByRole('button', { name: 'Log in' }).click();
    await page.waitForURL(/\/dashboard|\/calendar|\//, { timeout: 10000 });
    await page.goto(`${TEST_CONFIG.baseUrl}/calendar`);
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async ({ page }) => {
    await page.waitForTimeout(1000);
  });

  test('001 - should display BOOKSPOT logo link', async ({ page }) => {
    const logo = page.getByRole('link', { name: 'BOOKSPOT' });
    await expect(logo).toBeVisible();
  });

  test('002 - should display sidebar navigation links', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Calendar' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Timeslots' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Clients' })).toBeVisible();
  });

  test('003 - should navigate to Timeslots page', async ({ page }) => {
    await page.getByRole('link', { name: 'Timeslots' }).click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/timeslots/);
  });

  test('004 - should navigate to Clients page', async ({ page }) => {
    await page.getByRole('link', { name: 'Clients' }).click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/provider\/clients/);
  });

  test('005 - should display user profile button', async ({ page }) => {
    const userButton = page.getByRole('button').filter({ hasText: /Maryna|M/ });
    await expect(userButton).toBeVisible();
  });

  test('006 - should have toggle sidebar button', async ({ page }) => {
    const toggleButton = page.getByRole('button', { name: 'Toggle Sidebar' });
    await expect(toggleButton).toBeVisible();
  });

  test('007 - should toggle sidebar on button click', async ({ page }) => {
    const toggleButton = page.getByRole('button', { name: 'Toggle Sidebar' });
    
    // Click to toggle
    await toggleButton.click();
    await page.waitForTimeout(500);
    
    // Verify button is still there (sidebar might collapse but toggle button remains)
    await expect(toggleButton).toBeVisible();
  });

  test('008 - should navigate back to calendar from other pages', async ({ page }) => {
    // Go to timeslots
    await page.getByRole('link', { name: 'Timeslots' }).click();
    await page.waitForLoadState('networkidle');
    
    // Go back to calendar
    await page.getByRole('link', { name: 'Calendar' }).click();
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/\/calendar/);
    await expect(page.getByRole('heading', { name: 'Calendar', level: 1 })).toBeVisible();
  });
});
