const { chromium } = require('playwright');

async function debugPublicGallery() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  // Listen for console messages
  page.on('console', msg => console.log('CONSOLE:', msg.text()));
  
  try {
    console.log('🚀 Debugging public gallery...');
    
    await page.goto('http://localhost:3000/engine/exterior-ai');
    await page.waitForLoadState('networkidle');
    
    // Wait a bit for React to render
    await page.waitForTimeout(2000);
    
    // Find all checkboxes
    const checkboxes = await page.locator('input[type="checkbox"]');
    const checkboxCount = await checkboxes.count();
    console.log(`Found ${checkboxCount} checkboxes`);
    
    for (let i = 0; i < checkboxCount; i++) {
      const checkbox = checkboxes.nth(i);
      const isChecked = await checkbox.isChecked();
      const parent = await checkbox.locator('..').textContent();
      console.log(`Checkbox ${i}: checked=${isChecked}, parent text="${parent}"`);
    }
    
    // Look for the public gallery switch specifically
    const publicGallerySwitch = await page.locator('text=Public Gallery').locator('..').locator('input[type="checkbox"]');
    if (await publicGallerySwitch.count() > 0) {
      const isChecked = await publicGallerySwitch.isChecked();
      console.log('Public gallery switch found, checked:', isChecked);
    } else {
      console.log('Public gallery switch not found');
    }
    
    // Look for any switch components
    const switches = await page.locator('[role="switch"]');
    const switchCount = await switches.count();
    console.log(`Found ${switchCount} switches`);
    
    for (let i = 0; i < switchCount; i++) {
      const switchEl = switches.nth(i);
      const isChecked = await switchEl.getAttribute('aria-checked');
      const parent = await switchEl.locator('..').textContent();
      console.log(`Switch ${i}: checked=${isChecked}, parent text="${parent}"`);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await browser.close();
  }
}

debugPublicGallery().catch(console.error);
