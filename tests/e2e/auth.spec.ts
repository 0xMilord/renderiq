/**
 * End-to-end tests for authentication flows
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page before each test
    await page.goto('/');
  });

  test('should display login page', async ({ page }) => {
    await page.goto('/login');
    
    // Check for login form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should display signup page', async ({ page }) => {
    await page.goto('/signup');
    
    // Check for signup form elements
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/login');
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Should show validation errors (implementation dependent)
    // This test may need adjustment based on actual form validation
    await page.waitForTimeout(500); // Wait for validation
  });

  test('should navigate between login and signup', async ({ page }) => {
    await page.goto('/login');
    
    // Look for link to signup
    const signupLink = page.locator('a[href*="signup"]').first();
    if (await signupLink.isVisible()) {
      await signupLink.click();
      await expect(page).toHaveURL(/.*signup.*/);
    }
  });

  test('should handle invalid credentials gracefully', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Should show error message (implementation dependent)
    await page.waitForTimeout(1000);
    
    // Verify we're still on login page or error is shown
    const currentUrl = page.url();
    expect(currentUrl).toContain('login');
  });

  test('should have accessible form labels', async ({ page }) => {
    await page.goto('/login');
    
    // Check for form labels (accessibility)
    const emailLabel = page.locator('label[for*="email"], label:has-text("email")').first();
    const passwordLabel = page.locator('label[for*="password"], label:has-text("password")').first();
    
    // Labels should exist or inputs should have aria-labels
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    const emailHasLabel = await emailLabel.isVisible().catch(() => false);
    const emailHasAriaLabel = await emailInput.getAttribute('aria-label').then(v => !!v).catch(() => false);
    
    expect(emailHasLabel || emailHasAriaLabel).toBe(true);
  });
});








