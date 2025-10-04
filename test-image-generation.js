#!/usr/bin/env node

/**
 * Test script for arqihive AI Image Generation
 * This script tests the image generation API endpoint
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

async function testImageGeneration() {
  console.log('🧪 Testing arqihive AI Image Generation...\n');

  const testCases = [
    {
      name: 'Basic Image Generation',
      data: {
        prompt: 'modern house',
        style: 'realistic',
        quality: 'standard',
        aspectRatio: '16:9',
        type: 'image'
      }
    },
    {
      name: 'High Quality Image',
      data: {
        prompt: 'contemporary office building',
        style: 'modern',
        quality: 'high',
        aspectRatio: '4:3',
        type: 'image'
      }
    },
    {
      name: 'Square Format Image',
      data: {
        prompt: 'minimalist house design',
        style: 'minimalist',
        quality: 'standard',
        aspectRatio: '1:1',
        type: 'image'
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n📝 Testing: ${testCase.name}`);
    console.log(`   Prompt: ${testCase.data.prompt}`);
    console.log(`   Style: ${testCase.data.style}`);
    console.log(`   Quality: ${testCase.data.quality}`);
    console.log(`   Aspect Ratio: ${testCase.data.aspectRatio}`);

    try {
      const formData = new FormData();
      Object.entries(testCase.data).forEach(([key, value]) => {
        formData.append(key, value);
      });

      const startTime = Date.now();
      
      const response = await fetch(`${API_BASE_URL}/api/renders`, {
        method: 'POST',
        body: formData,
        headers: {
          // Note: In a real test, you'd need to include authentication headers
          // 'Authorization': 'Bearer your-token-here'
        }
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      if (response.ok) {
        const result = await response.json();
        console.log(`   ✅ Success! (${responseTime}ms)`);
        console.log(`   Status: ${result.data?.status || 'unknown'}`);
        console.log(`   Processing Time: ${result.data?.processingTime || 'unknown'}s`);
        console.log(`   Provider: ${result.data?.provider || 'unknown'}`);
        if (result.data?.outputUrl) {
          console.log(`   Output URL: ${result.data.outputUrl}`);
        }
      } else {
        const error = await response.text();
        console.log(`   ❌ Failed! (${responseTime}ms)`);
        console.log(`   Status: ${response.status}`);
        console.log(`   Error: ${error}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  console.log('\n🏁 Test completed!');
  console.log('\n📋 Next Steps:');
  console.log('1. Check server logs for detailed generation flow');
  console.log('2. Verify theme switching works in UI');
  console.log('3. Test user deletion (should cascade)');
  console.log('4. Monitor credit deduction and billing');
}

// Run the test
if (require.main === module) {
  testImageGeneration().catch(console.error);
}

module.exports = { testImageGeneration };
