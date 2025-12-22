import { expect, test } from '@playwright/test';
import { TEST_CONFIG } from './test-config';

test.describe('Calendar Provider Navigation', () => {
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

  test('001 - should navigate to next week and update date range', async ({ page }) => {
    const initialWeekHeading = await page.getByRole('heading', { level: 2 }).filter({ hasText: /\d{1,2} \w{3} - \d{1,2} \w{3} \d{4}/ }).textContent();
    
    await page.getByRole('button', { name: 'Next slide' }).click();
    await page.waitForTimeout(500);
    
    const newWeekHeading = await page.getByRole('heading', { level: 2 }).filter({ hasText: /\d{1,2} \w{3} - \d{1,2} \w{3} \d{4}/ }).textContent();
    
    expect(newWeekHeading).not.toBe(initialWeekHeading);
  });

  test('002 - should navigate to previous week and update date range', async ({ page }) => {
    // First go forward
    await page.getByRole('button', { name: 'Next slide' }).click();
    await page.waitForTimeout(500);
    
    const weekAfterForward = await page.getByRole('heading', { level: 2 }).filter({ hasText: /\d{1,2} \w{3} - \d{1,2} \w{3} \d{4}/ }).textContent();
    
    // Then go back
    await page.getByRole('button', { name: 'Previous slide' }).click();
    await page.waitForTimeout(500);
    
    const weekAfterBack = await page.getByRole('heading', { level: 2 }).filter({ hasText: /\d{1,2} \w{3} - \d{1,2} \w{3} \d{4}/ }).textContent();
    
    expect(weekAfterBack).not.toBe(weekAfterForward);
  });

  test('003 - should navigate multiple weeks forward', async ({ page }) => {
    const initialWeek = await page.getByRole('heading', { level: 2 }).filter({ hasText: /\d{1,2} \w{3} - \d{1,2} \w{3} \d{4}/ }).textContent();
    
    for (let i = 0; i < 3; i++) {
      await page.getByRole('button', { name: 'Next slide' }).click();
      await page.waitForTimeout(300);
    }
    
    const finalWeek = await page.getByRole('heading', { level: 2 }).filter({ hasText: /\d{1,2} \w{3} - \d{1,2} \w{3} \d{4}/ }).textContent();
    
    expect(finalWeek).not.toBe(initialWeek);
  });

  test('004 - should navigate multiple weeks backward', async ({ page }) => {
    // Go forward first
    for (let i = 0; i < 2; i++) {
      await page.getByRole('button', { name: 'Next slide' }).click();
      await page.waitForTimeout(300);
    }
    
    const weekBeforeBack = await page.getByRole('heading', { level: 2 }).filter({ hasText: /\d{1,2} \w{3} - \d{1,2} \w{3} \d{4}/ }).textContent();
    
    // Go back
    for (let i = 0; i < 2; i++) {
      await page.getByRole('button', { name: 'Previous slide' }).click();
      await page.waitForTimeout(300);
    }
    
    const weekAfterBack = await page.getByRole('heading', { level: 2 }).filter({ hasText: /\d{1,2} \w{3} - \d{1,2} \w{3} \d{4}/ }).textContent();
    
    expect(weekAfterBack).not.toBe(weekBeforeBack);
  });

  test('005 - should update day headers when navigating weeks', async ({ page }) => {
    const getFirstDay = async () => {
      const dayHeaders = await page.getByText(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), \d{1,2} \w{3}$/).all();
      if (dayHeaders.length > 0) {
        return await dayHeaders[0].textContent();
      }
      return null;
    };
    
    const initialDay = await getFirstDay();
    
    await page.getByRole('button', { name: 'Next slide' }).click();
    await page.waitForTimeout(500);
    
    const newDay = await getFirstDay();
    
    expect(newDay).not.toBe(initialDay);
  });

  test('006 - should be clickable - open timeslot', async ({ page }) => {
    const openTimeslots = await page.getByRole('button').filter({ hasText: /Open/ }).all();
    
    if (openTimeslots.length > 0) {
      await expect(openTimeslots[0]).toBeEnabled();
      // Click might navigate or open modal - just verify it's clickable
      await openTimeslots[0].click();
      await page.waitForTimeout(500);
    }
  });

  test('007 - should be clickable - booked timeslot', async ({ page }) => {
    const bookedTimeslots = await page.getByRole('button').filter({ hasText: /Booked/ }).all();
    
    if (bookedTimeslots.length > 0) {
      await expect(bookedTimeslots[0]).toBeEnabled();
      await bookedTimeslots[0].click();
      await page.waitForTimeout(500);
    }
  });

  test('008 - should be clickable - add timeslot button', async ({ page }) => {
    const addButtons = await page.getByRole('button', { name: 'Add Timeslot' }).all();
    
    if (addButtons.length > 0) {
      await expect(addButtons[0]).toBeEnabled();
      await addButtons[0].click();
      await page.waitForTimeout(500);
      // Might navigate or open modal
    }
  });
});
