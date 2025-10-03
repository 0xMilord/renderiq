const { chromium } = require('playwright');

async function testSpecificIssues() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  try {
    console.log('🚀 Testing specific layout issues...');
    
    // Test desktop layout
    await page.goto('http://localhost:3000/engine/exterior-ai');
    await page.waitForLoadState('networkidle');
    
    // 1. Check tabs overflow issue
    console.log('🔍 Checking tabs overflow...');
    const tabsContainer = await page.locator('.grid.w-full.grid-cols-2.m-3.flex-shrink-0.h-8');
    if (await tabsContainer.count() > 0) {
      const tabsRect = await tabsContainer.boundingBox();
      const parentRect = await tabsContainer.locator('..').boundingBox();
      
      console.log('Tabs container:', tabsRect);
      console.log('Parent container:', parentRect);
      
      if (tabsRect && parentRect) {
        const overflow = tabsRect.width > parentRect.width;
        console.log(overflow ? '❌ Tabs are overflowing' : '✅ Tabs fit properly');
      }
    }
    
    // 2. Check public gallery default state
    console.log('🔍 Checking public gallery default state...');
    const publicGallerySwitch = await page.locator('input[type="checkbox"]').nth(0); // First checkbox should be public gallery
    if (await publicGallerySwitch.count() > 0) {
      const isChecked = await publicGallerySwitch.isChecked();
      console.log('Public gallery checked:', isChecked);
      console.log(isChecked ? '✅ Public gallery enabled by default' : '❌ Public gallery should be enabled by default');
    }
    
    // 3. Check render preview horizontal clipping
    console.log('🔍 Checking render preview clipping...');
    const renderPreview = await page.locator('.w-2\\/3.overflow-hidden');
    if (await renderPreview.count() > 0) {
      const renderRect = await renderPreview.boundingBox();
      const viewportWidth = page.viewportSize().width;
      
      console.log('Render preview rect:', renderRect);
      console.log('Viewport width:', viewportWidth);
      
      if (renderRect && renderRect.x + renderRect.width > viewportWidth) {
        console.log('❌ Render preview is clipping horizontally');
      } else {
        console.log('✅ Render preview fits within viewport');
      }
    }
    
    // 4. Test mobile layout
    console.log('🔍 Testing mobile layout...');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Check mobile layout issues
    const mobileControlBar = await page.locator('.w-1\\/3.bg-background.border-r');
    const mobileRenderPreview = await page.locator('.w-2\\/3.overflow-hidden');
    
    if (await mobileControlBar.count() > 0 && await mobileRenderPreview.count() > 0) {
      const controlRect = await mobileControlBar.boundingBox();
      const renderRect = await mobileRenderPreview.boundingBox();
      
      console.log('Mobile control bar:', controlRect);
      console.log('Mobile render preview:', renderRect);
      
      const totalWidth = (controlRect?.width || 0) + (renderRect?.width || 0);
      console.log('Total width:', totalWidth);
      console.log('Viewport width: 375');
      
      if (totalWidth > 375) {
        console.log('❌ Layout overflowing on mobile');
      } else {
        console.log('✅ Layout fits on mobile');
      }
    }
    
    // 5. Test all engine pages
    console.log('🔍 Testing all engine pages...');
    const enginePages = [
      '/engine/exterior-ai',
      '/engine/interior-ai', 
      '/engine/furniture-ai',
      '/engine/site-plan-ai'
    ];
    
    for (const enginePage of enginePages) {
      console.log(`Testing ${enginePage}...`);
      await page.goto(`http://localhost:3000${enginePage}`);
      await page.waitForLoadState('networkidle');
      
      // Check for horizontal scroll
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      
      console.log(hasHorizontalScroll ? `❌ ${enginePage} has horizontal scroll` : `✅ ${enginePage} no horizontal scroll`);
    }
    
    console.log('✅ Specific issues testing completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testSpecificIssues().catch(console.error);
