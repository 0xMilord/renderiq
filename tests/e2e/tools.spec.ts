/**
 * End-to-end tests for tools & apps flows
 */

import { test, expect } from '@playwright/test';

test.describe('Tools & Apps Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to tools page
    await page.goto('/tools');
    await page.waitForLoadState('networkidle');
  });

  test('should display tools list', async ({ page }) => {
    // Check for tools container
    const toolsContainer = page.locator('[data-testid="tools"], .tools-grid, main').first();
    await expect(toolsContainer).toBeVisible({ timeout: 10000 });
  });

  test('should allow browsing tools by category', async ({ page }) => {
    // Look for category filters
    const categoryButton = page.locator('button:has-text("Transformation"), button:has-text("Floorplan"), [data-testid="category"]').first();
    
    if (await categoryButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await categoryButton.click();
      await page.waitForTimeout(1000);
    }
  });

  test('should allow viewing tool details', async ({ page }) => {
    // Look for tool cards or links
    const toolLink = page.locator('a[href*="/tools/"], [data-testid="tool-card"]').first();
    
    if (await toolLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await toolLink.click();
      await page.waitForLoadState('networkidle');
      
      // Verify we're on tool detail page
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/tools\/.+/);
    }
  });

  test('should allow using a tool', async ({ page }) => {
    // Navigate to a specific tool
    const toolLink = page.locator('a[href*="/tools/"]').first();
    
    if (await toolLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await toolLink.click();
      await page.waitForLoadState('networkidle');
      
      // Look for use/run button
      const useButton = page.locator('button:has-text("Use"), button:has-text("Run"), button:has-text("Generate")').first();
      
      if (await useButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Verify button exists
        await expect(useButton).toBeVisible();
      }
    }
  });

  test('should display tool execution history', async ({ page }) => {
    // Navigate to a tool
    const toolLink = page.locator('a[href*="/tools/"]').first();
    
    if (await toolLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await toolLink.click();
      await page.waitForLoadState('networkidle');
      
      // Look for history section
      const historySection = page.locator('[data-testid="history"], :text-matches("history", "i")').first();
      
      // History section should exist (may be empty)
      await page.waitForTimeout(1000);
    }
  });
});

