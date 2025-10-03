const { chromium } = require('playwright');

async function testGenerateButton() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  try {
    console.log('🚀 Testing generate button improvements...');
    
    await page.goto('http://localhost:3000/engine/exterior-ai');
    await page.waitForLoadState('networkidle');
    
    // Wait for component to load
    await page.waitForTimeout(2000);
    
    // Take screenshot of initial state
    await page.screenshot({ path: 'generate-button-initial.png', fullPage: true });
    console.log('📸 Initial state screenshot saved');
    
    // Check if generate button is disabled and why
    const generateButton = await page.locator('button:has-text("Generate")');
    if (await generateButton.count() > 0) {
      const isDisabled = await generateButton.isDisabled();
      console.log('Generate button disabled:', isDisabled);
      
      // Check for requirement messages
      const promptAlert = await page.locator('text=Please enter a prompt to generate');
      const projectAlert = await page.locator('text=Please select a project');
      const creditsAlert = await page.locator('text=Insufficient credits');
      
      if (await promptAlert.count() > 0) {
        console.log('✅ Prompt requirement message shown');
      }
      if (await projectAlert.count() > 0) {
        console.log('✅ Project requirement message shown');
      }
      if (await creditsAlert.count() > 0) {
        console.log('✅ Credits requirement message shown');
      }
    }
    
    // Test entering a prompt
    console.log('🔍 Testing with prompt entered...');
    const promptInput = await page.locator('textarea[placeholder*="Describe your image"]');
    if (await promptInput.count() > 0) {
      await promptInput.fill('Test prompt for generation');
      await page.waitForTimeout(500);
      
      await page.screenshot({ path: 'generate-button-with-prompt.png', fullPage: true });
      console.log('📸 With prompt screenshot saved');
      
      // Check if project requirement is now shown
      const projectAlert = await page.locator('text=Please select a project');
      if (await projectAlert.count() > 0) {
        console.log('✅ Project requirement message shown after entering prompt');
      }
    }
    
    // Test selecting a project
    console.log('🔍 Testing with project selected...');
    const projectSelect = await page.locator('[role="combobox"]').first();
    if (await projectSelect.count() > 0) {
      await projectSelect.click();
      await page.waitForTimeout(500);
      
      // Look for project options
      const projectOptions = await page.locator('[role="option"]');
      if (await projectOptions.count() > 0) {
        await projectOptions.first().click();
        await page.waitForTimeout(500);
        
        await page.screenshot({ path: 'generate-button-with-project.png', fullPage: true });
        console.log('📸 With project screenshot saved');
        
        // Check if generate button is now enabled
        const generateButton = await page.locator('button:has-text("Generate")');
        if (await generateButton.count() > 0) {
          const isDisabled = await generateButton.isDisabled();
          console.log('Generate button disabled after project selection:', isDisabled);
          
          if (!isDisabled) {
            console.log('✅ Generate button is now enabled!');
          }
        }
      }
    }
    
    // Check credits display
    console.log('🔍 Checking credits display...');
    const creditsDisplay = await page.locator('text=Balance:');
    if (await creditsDisplay.count() > 0) {
      const creditsText = await creditsDisplay.textContent();
      console.log('Credits display:', creditsText);
    }
    
    console.log('✅ Generate button testing completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testGenerateButton().catch(console.error);
