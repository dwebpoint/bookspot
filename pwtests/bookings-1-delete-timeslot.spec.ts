import { test, expect } from '@playwright/test';
import { TEST_CONFIG } from './test-config';

test.describe('Bookings - Delete Timeslot', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto(`${TEST_CONFIG.baseUrl}/login`);

    // Login as ServiceProvider
    await page.getByRole('textbox', { name: 'Email address' }).fill(TEST_CONFIG.credentials.serviceProvider.email);
    await page.getByRole('textbox', { name: 'Password' }).fill(TEST_CONFIG.credentials.serviceProvider.password);
    await page.getByRole('button', { name: 'Log in' }).click();

    // Wait for calendar page to load after successful login
    await expect(page).toHaveURL(`${TEST_CONFIG.baseUrl}/calendar`);
    await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible();
  });

  test('should delete a timeslot record', async ({ page }) => {
    // Navigate to Bookings page to check for existing booked timeslots
    await page.getByRole('link', { name: 'Bookings' }).click();
    await expect(page).toHaveURL(`${TEST_CONFIG.baseUrl}/bookings`);
    await expect(page.getByRole('heading', { name: 'Booked Timeslots' })).toBeVisible();

    // Switch to Booked tab
    await page.getByRole('tab', { name: 'Booked' }).click();

    // Try to find first booked timeslot
    const bookedRows = page.getByRole('row').filter({ hasText: 'Booked' });
    const initialCount = await bookedRows.count();

    if (initialCount === 0) {
      // No booked timeslots exist, skip test
      test.skip();
    }

    // Booked timeslot exists, delete the first one
    const firstBookedRow = bookedRows.first();
    const timeslotText = await firstBookedRow.getByRole('cell').first().textContent();
    
    // Click Delete button
    await firstBookedRow.getByRole('button', { name: /Delete Timeslot|Delete/ }).click();
    await expect(page.getByRole('alertdialog', { name: /Delete Timeslot|Delete/ })).toBeVisible();
    await page.getByRole('button', { name: /Yes, delete|Confirm/ }).click();
    await expect(page.getByRole('alertdialog', { name: /Delete Timeslot|Delete/ })).not.toBeVisible();
    
    // Verify deletion - count should be reduced by 1
    const updatedBookedRows = page.getByRole('row').filter({ hasText: 'Booked' });
    const updatedCount = await updatedBookedRows.count();
    expect(updatedCount).toBe(initialCount - 1);
  });
});
