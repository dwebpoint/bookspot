import { test, expect } from '@playwright/test';
import { TEST_CONFIG } from './test-config';

test.describe('Bookings - Mark as Completed', () => {
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

  test('should mark a booked timeslot as completed', async ({ page }) => {
    // Navigate to Bookings page
    await page.getByRole('link', { name: 'Bookings' }).click();
    await expect(page).toHaveURL(`${TEST_CONFIG.baseUrl}/bookings`);
    await expect(page.getByRole('heading', { name: 'Booked Timeslots' })).toBeVisible();

    // Switch to Booked tab
    await page.getByRole('tab', { name: 'Booked' }).click();

    // Try to find first not Completed record
    let firstNotCompletedRow = await page.getByRole('row').filter({ hasText: 'Booked' }).first();
    let timeslotDate: string | null = null;
    let found = false;
    try {
      await expect(firstNotCompletedRow).toBeVisible({ timeout: 3000 });
      timeslotDate = await firstNotCompletedRow.getByRole('cell').first().textContent();
      found = true;
    } catch {
      found = false;
    }

    // If not found, create new timeslot and book it with any active client
    if (!found) {
      // Navigate to Create Timeslot page
      await page.goto(`${TEST_CONFIG.baseUrl}/provider/timeslots/create`);
      await expect(page.getByRole('heading', { name: 'Create Timeslot' })).toBeVisible();
      
      // Fill in the form
      await page.getByLabel('Start Time').fill('2099-01-01T09:00');
      await page.getByRole('button', { name: 'Select duration' }).click();
      await page.getByRole('option', { name: '1 hour' }).click();
      await page.getByRole('button', { name: 'Create Timeslot' }).click();
      
      // Wait for redirect
      await page.waitForURL(/\/(provider\/timeslots|calendar)/);
      await expect(page.getByText('Timeslot created successfully')).toBeVisible({ timeout: 5000 });

      // Book with any active client
      await page.getByRole('button', { name: /Book|Assign Client/ }).click();
      // Select first client in list
      await page.getByRole('option').first().click();
      await page.getByRole('button', { name: 'Confirm' }).click();

      // Go back to Bookings page
      await page.getByRole('link', { name: 'Bookings' }).click();
      await expect(page).toHaveURL(`${TEST_CONFIG.baseUrl}/bookings`);
      await page.getByRole('tab', { name: 'Booked' }).click();
      firstNotCompletedRow = await page.getByRole('row').filter({ hasText: 'Booked' }).first();
      timeslotDate = await firstNotCompletedRow.getByRole('cell').first().textContent();
    }

    // Click "Mark as Completed" button
    await firstNotCompletedRow.getByRole('button', { name: 'Mark as Completed' }).click();
    await expect(page.getByRole('alertdialog', { name: 'Mark as Completed' })).toBeVisible();
    await expect(page.getByText('Are you sure you want to mark this timeslot as completed?')).toBeVisible();
    await page.getByRole('button', { name: 'Yes, mark as completed' }).click();
    
    // Wait for dialog to close
    await expect(page.getByRole('alertdialog', { name: 'Mark as Completed' })).not.toBeVisible();
    
    // Wait for page to process the update
    await page.waitForLoadState('networkidle');
    
    // Verify we're still on bookings page
    await expect(page).toHaveURL(`${TEST_CONFIG.baseUrl}/bookings`);
    
    // Switch to Completed tab
    await page.getByRole('tab', { name: 'Completed' }).click();
    
    // Wait for tab to be selected
    await expect(page.getByRole('tab', { name: 'Completed' })).toHaveAttribute('aria-selected', 'true');
    
    // Verify the timeslot appears in Completed tab
    const completedRow = page.getByRole('row').filter({ hasText: timeslotDate! });
    await expect(completedRow).toBeVisible();
    await expect(completedRow.getByText('Completed')).toBeVisible();
  });

  test('should cancel marking as completed when clicking Cancel', async ({ page }) => {
    // Navigate to Bookings page
    await page.getByRole('link', { name: 'Bookings' }).click();
    await expect(page).toHaveURL(`${TEST_CONFIG.baseUrl}/bookings`);

    // Switch to Booked tab to ensure we're looking at booked timeslots
    await page.getByRole('tab', { name: 'Booked' }).click();

    // Verify there is at least one booked timeslot
    const firstBookedRow = page.getByRole('row').filter({ hasText: 'Booked' }).first();
    await expect(firstBookedRow).toBeVisible();

    // Click "Mark as Completed" button
    await firstBookedRow.getByRole('button', { name: 'Mark as Completed' }).click();

    // Verify confirmation dialog appears
    await expect(page.getByRole('alertdialog', { name: 'Mark as Completed' })).toBeVisible();

    // Click Cancel button
    await page.getByRole('button', { name: 'Cancel' }).click();

    // Verify dialog is closed and status remains "Booked"
    await expect(page.getByRole('alertdialog', { name: 'Mark as Completed' })).not.toBeVisible();
    await expect(firstBookedRow.getByText('Booked')).toBeVisible();
  });
});
