const { chromium } = require('playwright');

async function testEngineLayout() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  try {
    console.log('🚀 Starting engine layout tests...');
    
    // Test desktop layout
    console.log('📱 Testing desktop layout (1280x720)...');
    await page.goto('http://localhost:3000/engine/exterior-ai');
    await page.waitForLoadState('networkidle');
    
    // Check for tab overflow issues
    const tabsContainer = await page.locator('[data-testid="tabs-list"], .grid.w-full.grid-cols-2');
    if (await tabsContainer.count() > 0) {
      const tabsRect = await tabsContainer.boundingBox();
      const parentRect = await tabsContainer.locator('..').boundingBox();
      console.log('📊 Tabs container dimensions:', tabsRect);
      console.log('📊 Parent container dimensions:', parentRect);
      
      if (tabsRect && parentRect && tabsRect.width > parentRect.width) {
        console.log('❌ ISSUE: Tabs are overflowing horizontally');
      } else {
        console.log('✅ Tabs fit within container');
      }
    }
    
    // Check control bar layout
    const controlBar = await page.locator('.w-1\\/3.bg-background.border-r');
    if (await controlBar.count() > 0) {
      const controlBarRect = await controlBar.boundingBox();
      console.log('📊 Control bar dimensions:', controlBarRect);
      
      // Check if control bar is properly sized
      if (controlBarRect && controlBarRect.width < 200) {
        console.log('❌ ISSUE: Control bar too narrow');
      } else {
        console.log('✅ Control bar width looks good');
      }
    }
    
    // Check render preview layout
    const renderPreview = await page.locator('.w-2\\/3.overflow-hidden');
    if (await renderPreview.count() > 0) {
      const renderPreviewRect = await renderPreview.boundingBox();
      console.log('📊 Render preview dimensions:', renderPreviewRect);
      
      // Check for horizontal clipping
      const viewportWidth = page.viewportSize().width;
      if (renderPreviewRect && renderPreviewRect.x + renderPreviewRect.width > viewportWidth) {
        console.log('❌ ISSUE: Render preview is clipping horizontally');
      } else {
        console.log('✅ Render preview fits within viewport');
      }
    }
    
    // Check public gallery default state
    const publicGallerySwitch = await page.locator('input[type="checkbox"]').filter({ hasText: 'Public Gallery' });
    if (await publicGallerySwitch.count() > 0) {
      const isChecked = await publicGallerySwitch.isChecked();
      console.log('📊 Public gallery switch checked:', isChecked);
      if (!isChecked) {
        console.log('❌ ISSUE: Public gallery should be enabled by default for free users');
      } else {
        console.log('✅ Public gallery is enabled by default');
      }
    }
    
    // Test mobile layout
    console.log('📱 Testing mobile layout (375x667)...');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Check mobile responsiveness
    const mobileControlBar = await page.locator('.w-1\\/3.bg-background.border-r');
    if (await mobileControlBar.count() > 0) {
      const mobileControlBarRect = await mobileControlBar.boundingBox();
      console.log('📊 Mobile control bar dimensions:', mobileControlBarRect);
      
      if (mobileControlBarRect && mobileControlBarRect.width < 100) {
        console.log('❌ ISSUE: Control bar too narrow on mobile');
      } else {
        console.log('✅ Control bar mobile width acceptable');
      }
    }
    
    // Check mobile render preview
    const mobileRenderPreview = await page.locator('.w-2\\/3.overflow-hidden');
    if (await mobileRenderPreview.count() > 0) {
      const mobileRenderPreviewRect = await mobileRenderPreview.boundingBox();
      console.log('📊 Mobile render preview dimensions:', mobileRenderPreviewRect);
      
      if (mobileRenderPreviewRect && mobileRenderPreviewRect.x + mobileRenderPreviewRect.width > 375) {
        console.log('❌ ISSUE: Render preview overflowing on mobile');
      } else {
        console.log('✅ Render preview fits on mobile');
      }
    }
    
    // Test tablet layout
    console.log('📱 Testing tablet layout (768x1024)...');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Check tablet layout
    const tabletControlBar = await page.locator('.w-1\\/3.bg-background.border-r');
    const tabletRenderPreview = await page.locator('.w-2\\/3.overflow-hidden');
    
    if (await tabletControlBar.count() > 0 && await tabletRenderPreview.count() > 0) {
      const tabletControlBarRect = await tabletControlBar.boundingBox();
      const tabletRenderPreviewRect = await tabletRenderPreview.boundingBox();
      
      console.log('📊 Tablet control bar dimensions:', tabletControlBarRect);
      console.log('📊 Tablet render preview dimensions:', tabletRenderPreviewRect);
      
      const totalWidth = (tabletControlBarRect?.width || 0) + (tabletRenderPreviewRect?.width || 0);
      if (totalWidth > 768) {
        console.log('❌ ISSUE: Layout overflowing on tablet');
      } else {
        console.log('✅ Layout fits on tablet');
      }
    }
    
    // Test all engine pages
    const enginePages = [
      '/engine/exterior-ai',
      '/engine/interior-ai', 
      '/engine/furniture-ai',
      '/engine/site-plan-ai'
    ];
    
    for (const enginePage of enginePages) {
      console.log(`🔍 Testing ${enginePage}...`);
      await page.goto(`http://localhost:3000${enginePage}`);
      await page.waitForLoadState('networkidle');
      
      // Check for any layout issues on each page
      const hasOverflow = await page.evaluate(() => {
        const body = document.body;
        return body.scrollWidth > body.clientWidth;
      });
      
      if (hasOverflow) {
        console.log(`❌ ISSUE: Horizontal overflow detected on ${enginePage}`);
      } else {
        console.log(`✅ No horizontal overflow on ${enginePage}`);
      }
    }
    
    console.log('✅ Engine layout tests completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testEngineLayout().catch(console.error);
