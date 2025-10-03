const { chromium } = require('playwright');

async function testLayoutFixes() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  try {
    console.log('🚀 Testing layout fixes...');
    
    // Test desktop layout
    console.log('📱 Testing desktop layout (1280x720)...');
    await page.goto('http://localhost:3000/engine/exterior-ai');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot
    await page.screenshot({ path: 'desktop-fixed.png', fullPage: true });
    console.log('📸 Desktop screenshot saved');
    
    // Check public gallery state
    console.log('🔍 Checking public gallery state...');
    const publicGallerySwitch = await page.locator('input[type="checkbox"]').first();
    if (await publicGallerySwitch.count() > 0) {
      const isChecked = await publicGallerySwitch.isChecked();
      console.log('Public gallery checked:', isChecked);
      
      // Try to find the switch by looking for the label
      const publicGalleryLabel = await page.locator('text=Public Gallery').locator('..').locator('input[type="checkbox"]');
      if (await publicGalleryLabel.count() > 0) {
        const isCheckedByLabel = await publicGalleryLabel.isChecked();
        console.log('Public gallery checked (by label):', isCheckedByLabel);
      }
    }
    
    // Check layout dimensions
    console.log('🔍 Checking layout dimensions...');
    const controlBar = await page.locator('.bg-background.border-r.border-border');
    const renderPreview = await page.locator('.bg-background.flex.flex-col.min-w-0');
    
    if (await controlBar.count() > 0) {
      const controlRect = await controlBar.boundingBox();
      console.log('Control bar dimensions:', controlRect);
    }
    
    if (await renderPreview.count() > 0) {
      const renderRect = await renderPreview.boundingBox();
      console.log('Render preview dimensions:', renderRect);
    }
    
    // Test mobile layout
    console.log('📱 Testing mobile layout (375x667)...');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Take mobile screenshot
    await page.screenshot({ path: 'mobile-fixed.png', fullPage: true });
    console.log('📸 Mobile screenshot saved');
    
    // Check mobile layout
    const mobileControlBar = await page.locator('.bg-background.border-r.border-border');
    const mobileRenderPreview = await page.locator('.bg-background.flex.flex-col.min-w-0');
    
    if (await mobileControlBar.count() > 0 && await mobileRenderPreview.count() > 0) {
      const controlRect = await mobileControlBar.boundingBox();
      const renderRect = await mobileRenderPreview.boundingBox();
      
      console.log('Mobile control bar:', controlRect);
      console.log('Mobile render preview:', renderRect);
      
      const totalWidth = (controlRect?.width || 0) + (renderRect?.width || 0);
      console.log('Total width:', totalWidth);
      console.log('Viewport width: 375');
      
      if (totalWidth > 375) {
        console.log('❌ Layout still overflowing on mobile');
      } else {
        console.log('✅ Layout fits on mobile');
      }
    }
    
    // Test tablet layout
    console.log('📱 Testing tablet layout (768x1024)...');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Take tablet screenshot
    await page.screenshot({ path: 'tablet-fixed.png', fullPage: true });
    console.log('📸 Tablet screenshot saved');
    
    console.log('✅ Layout fixes testing completed');
    console.log('📸 Screenshots saved: desktop-fixed.png, mobile-fixed.png, tablet-fixed.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testLayoutFixes().catch(console.error);
