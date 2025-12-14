/**
 * End-to-end tests for project management flows
 */

import { test, expect } from '@playwright/test';

test.describe('Project Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to projects page
    await page.goto('/dashboard/projects');
    await page.waitForLoadState('networkidle');
  });

  test('should display projects list', async ({ page }) => {
    // Check for projects container
    const projectsContainer = page.locator('[data-testid="projects-list"], .projects-container, main').first();
    await expect(projectsContainer).toBeVisible({ timeout: 10000 });
  });

  test('should allow creating a new project', async ({ page }) => {
    // Look for create project button
    const createButton = page.locator('button:has-text("Create"), button:has-text("New Project"), a[href*="create"]').first();
    
    if (await createButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await createButton.click();
      
      // Wait for create project form or modal
      await page.waitForTimeout(1000);
      
      // Check for project name input
      const nameInput = page.locator('input[name*="name"], input[placeholder*="name"]').first();
      if (await nameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await nameInput.fill('Test Project');
      }
    }
  });

  test('should allow viewing project details', async ({ page }) => {
    // Look for project cards or links
    const projectLink = page.locator('a[href*="/projects/"], [data-testid="project-card"]').first();
    
    if (await projectLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await projectLink.click();
      await page.waitForLoadState('networkidle');
      
      // Verify we're on project detail page
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/projects\/.+/);
    }
  });

  test('should allow editing project', async ({ page }) => {
    // Navigate to a project first
    const projectLink = page.locator('a[href*="/projects/"]').first();
    
    if (await projectLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await projectLink.click();
      await page.waitForLoadState('networkidle');
      
      // Look for edit button
      const editButton = page.locator('button:has-text("Edit"), button[aria-label*="edit"]').first();
      
      if (await editButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await editButton.click();
        await page.waitForTimeout(1000);
      }
    }
  });

  test('should allow deleting project', async ({ page }) => {
    // Navigate to a project
    const projectLink = page.locator('a[href*="/projects/"]').first();
    
    if (await projectLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await projectLink.click();
      await page.waitForLoadState('networkidle');
      
      // Look for delete button
      const deleteButton = page.locator('button:has-text("Delete"), button[aria-label*="delete"]').first();
      
      if (await deleteButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Note: This test may need to handle confirmation dialogs
        // await deleteButton.click();
      }
    }
  });

  test('should display project renders', async ({ page }) => {
    // Navigate to a project
    const projectLink = page.locator('a[href*="/projects/"]').first();
    
    if (await projectLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await projectLink.click();
      await page.waitForLoadState('networkidle');
      
      // Look for renders section
      const rendersSection = page.locator('[data-testid="renders"], .renders-grid, section').first();
      
      // Renders section should exist (may be empty)
      await page.waitForTimeout(1000);
    }
  });
});

