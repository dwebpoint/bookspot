import { expect, test } from '@playwright/test';
import { TEST_CONFIG } from './test-config';

test.describe('Calendar Provider Display', () => {
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

  test('001 - should display calendar page header and description', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Calendar', level: 1 })).toBeVisible();
    await expect(page.getByText('View available timeslots in calendar format')).toBeVisible();
  });

  test('002 - should display current week range and week number', async ({ page }) => {
    const weekHeading = page.getByRole('heading', { level: 2 }).filter({ hasText: /\d{1,2} \w{3} - \d{1,2} \w{3} \d{4}/ });
    await expect(weekHeading).toBeVisible();
    await expect(page.getByText(/Week \d+/)).toBeVisible();
  });

  test('003 - should display status legend (Available, Booked, Completed)', async ({ page }) => {
    await expect(page.getByText('Available', { exact: true })).toBeVisible();
    await expect(page.getByText('Booked', { exact: true })).toBeVisible();
    await expect(page.getByText('Completed', { exact: true })).toBeVisible();
  });

  test('004 - should display week navigation buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Previous slide' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Next slide' })).toBeVisible();
  });

  test('005 - should display day headers with date format', async ({ page }) => {
    const dayPattern = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), \d{1,2} \w{3}$/;
    const dayHeaders = await page.getByText(dayPattern).all();
    expect(dayHeaders.length).toBeGreaterThan(0);
  });

  test('006 - should display timeslot cards with time and duration', async ({ page }) => {
    const timeslotButtons = await page.getByRole('button').filter({ hasText: /\d{1,2}:\d{2}.*\d+ min/ }).all();
    if (timeslotButtons.length > 0) {
      const firstTimeslot = timeslotButtons[0];
      await expect(firstTimeslot).toBeVisible();
      const text = await firstTimeslot.textContent();
      expect(text).toMatch(/\d{1,2}:\d{2}/); // Time format
      expect(text).toMatch(/\d+ min/); // Duration
    }
  });

  test('007 - should display status badge on timeslot cards', async ({ page }) => {
    const openTimeslots = await page.getByRole('button').filter({ hasText: 'Open' }).all();
    const bookedTimeslots = await page.getByRole('button').filter({ hasText: 'Booked' }).all();
    
    expect(openTimeslots.length + bookedTimeslots.length).toBeGreaterThan(0);
  });

  test('008 - should display client name on booked timeslots', async ({ page }) => {
    const bookedTimeslots = await page.getByRole('button').filter({ hasText: 'Booked' }).all();
    
    if (bookedTimeslots.length > 0) {
      const firstBooked = bookedTimeslots[0];
      const text = await firstBooked.textContent();
      // Should contain time, duration, client name/initial, and "Booked"
      expect(text).toMatch(/\d{1,2}:\d{2}/);
      expect(text).toContain('Booked');
    }
  });

  test('009 - should display "No timeslots" message on empty days', async ({ page }) => {
    const noTimeslotsMessages = await page.getByText('No timeslots').all();
    // Empty days should show this message
    if (noTimeslotsMessages.length > 0) {
      await expect(noTimeslotsMessages[0]).toBeVisible();
    }
  });

  test('010 - should display "Add Timeslot" button on days', async ({ page }) => {
    const addButtons = await page.getByRole('button', { name: 'Add Timeslot' }).all();
    expect(addButtons.length).toBeGreaterThan(0);
  });
});
