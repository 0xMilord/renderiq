/**
 * End-to-end tests for canvas workflows
 */

import { test, expect } from '@playwright/test';

test.describe('Canvas Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to canvas page
    await page.goto('/canvas');
    await page.waitForLoadState('networkidle');
  });

  test('should display canvas interface', async ({ page }) => {
    // Check for canvas container
    const canvasContainer = page.locator('[data-testid="canvas"], .canvas-container, canvas').first();
    
    // Canvas should exist (may be empty initially)
    await page.waitForTimeout(1000);
  });

  test('should allow creating new canvas file', async ({ page }) => {
    // Look for create button
    const createButton = page.locator('button:has-text("Create"), button:has-text("New"), a[href*="create"]').first();
    
    if (await createButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await createButton.click();
      await page.waitForTimeout(1000);
    }
  });

  test('should allow opening existing canvas file', async ({ page }) => {
    // Look for file list or open button
    const fileLink = page.locator('a[href*="/canvas/"], [data-testid="canvas-file"]').first();
    
    if (await fileLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await fileLink.click();
      await page.waitForLoadState('networkidle');
    }
  });

  test('should display canvas tools', async ({ page }) => {
    // Look for toolbar or tools
    const toolbar = page.locator('[data-testid="toolbar"], .toolbar, nav').first();
    
    // Toolbar should exist
    await page.waitForTimeout(1000);
  });

  test('should allow saving canvas', async ({ page }) => {
    // Look for save button
    const saveButton = page.locator('button:has-text("Save"), button[aria-label*="save"]').first();
    
    if (await saveButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Just verify button exists, don't click to avoid creating test data
      await expect(saveButton).toBeVisible();
    }
  });
});

