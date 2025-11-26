import { expect, test } from '@playwright/test';
import { TEST_CONFIG } from './test-config';

test.describe('Authentication', () => {
  test('001 - should login as Service Provider', async ({ page }) => {
    await page.goto(`${TEST_CONFIG.baseUrl}/login`);

    await expect(page).toHaveTitle(/Log in/);

    await page.getByRole('textbox', { name: 'Email address' }).fill(TEST_CONFIG.credentials.serviceProvider.email);
    await page.getByRole('textbox', { name: 'Password' }).fill(TEST_CONFIG.credentials.serviceProvider.password);

    await page.getByRole('button', { name: 'Log in' }).click();

    await expect(page).toHaveURL(/\/dashboard|\/calendar|\/$/);
  });

  test('002 - should show validation error for invalid credentials', async ({ page }) => {
    await page.goto(`${TEST_CONFIG.baseUrl}/login`);

    await page.getByRole('textbox', { name: 'Email address' }).fill('invalid@example.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('wrongpassword');

    await page.getByRole('button', { name: 'Log in' }).click();

    await expect(page.getByText(/credentials/i)).toBeVisible();
  });

  test('003 - should redirect to login when accessing protected route', async ({ page }) => {
    await page.goto(`${TEST_CONFIG.baseUrl}/dashboard`);

    await expect(page).toHaveURL(/\/login/);
  });
});
