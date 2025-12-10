# Extension Warehouse Submission Guide

## Overview

This guide covers how to package and submit the Renderiq SketchUp plugin to the Extension Warehouse.

## Prerequisites

1. **Developer Account**
   - Apply for developer status at [Extension Warehouse Developer Portal](https://extensions.sketchup.com/developers)
   - Wait for approval (usually 1-2 business days)

2. **Required Files**
   - Plugin RBZ file
   - Screenshots (at least 3)
   - Icon (256x256 PNG)
   - Documentation

## Packaging the Plugin

### Step 1: Create Plugin Structure

Ensure your plugin has this structure:

```
renderiq/
├── renderiq.rb              # Main plugin file (optional, if using loader.rb)
├── renderiq/
│   ├── loader.rb            # Extension loader
│   ├── camera_manager.rb
│   ├── screenshot_capture.rb
│   ├── api_client.rb
│   ├── settings_dialog.rb
│   ├── render_dialog.rb
│   ├── main_dialog.rb
│   └── utils.rb
└── resources/
    └── icons/
        ├── renderiq_16.png
        ├── renderiq_24.png
        └── renderiq_32.png
```

### Step 2: Create RBZ File

An RBZ file is a ZIP archive with a `.rbz` extension.

**On Windows:**
1. Select all plugin files
2. Right-click > Send to > Compressed (zipped) folder
3. Rename `.zip` to `.rbz`

**On Mac:**
```bash
cd sketchup-plugin
zip -r renderiq.rbz renderiq/ resources/
```

**Using Ruby script:**
```ruby
require 'zip'

def create_rbz(source_dir, output_file)
  Zip::File.open(output_file, Zip::File::CREATE) do |zip|
    Dir[File.join(source_dir, '**', '**')].each do |file|
      zip.add(file.sub(source_dir + '/', ''), file)
    end
  end
end

create_rbz('renderiq', 'renderiq.rbz')
```

### Step 3: Test RBZ File

1. Open SketchUp
2. Go to **Window > Preferences > Extensions**
3. Click **Install Extension**
4. Select the RBZ file
5. Restart SketchUp
6. Verify plugin loads and works correctly

## Extension Warehouse Submission

### Step 1: Login to Developer Portal

1. Go to [Extension Warehouse Developer Portal](https://extensions.sketchup.com/developers)
2. Login with your developer account

### Step 2: Create New Extension

1. Click **"Submit New Extension"**
2. Fill in extension details:

**Basic Information:**
- **Name**: Renderiq AI Renderer
- **Version**: 1.0.0
- **Category**: Rendering
- **Description**: 
  ```
  Transform your SketchUp models into photorealistic renders using AI. 
  Capture screenshots from your 3D models and generate professional 
  architectural visualizations with realistic materials, lighting, and 
  environmental context.
  ```

**Detailed Description:**
```
Renderiq AI Renderer brings powerful AI rendering capabilities directly 
into SketchUp. Simply capture a screenshot of your 3D model and generate 
photorealistic architectural renders in seconds.

Features:
• Camera Position Management - Save and load camera positions
• High-Quality Screenshot Capture - Export views at various resolutions
• AI-Powered Rendering - Generate photorealistic renders using Renderiq API
• System Prompt Based - No manual prompt writing required
• Configurable Settings - Quality, aspect ratio, style, and model selection
• Real-time Progress Tracking - Monitor render status
• Easy Download - Save rendered images directly

Perfect for architects, designers, and 3D artists who want to quickly 
create professional visualizations from their SketchUp models.
```

**Keywords:**
```
AI, rendering, photorealistic, architecture, visualization, render, 
SketchUp, 3D, design, materials, lighting, camera, screenshot
```

### Step 3: Upload Files

**RBZ File:**
- Upload the `renderiq.rbz` file
- Maximum size: 50MB

**Icon:**
- 256x256 PNG
- Transparent background recommended
- Square format

**Screenshots:**
- Minimum 3 screenshots
- Recommended: 1280x720 or larger
- Show:
  1. Plugin UI / Settings dialog
  2. Before/After comparison
  3. Render results
  4. Camera management

### Step 4: Compatibility

**SketchUp Versions:**
- [x] SketchUp 2020
- [x] SketchUp 2021
- [x] SketchUp 2022
- [x] SketchUp 2023
- [x] SketchUp 2024

**Platforms:**
- [x] Windows
- [x] Mac

### Step 5: Pricing & Distribution

**Pricing:**
- Free (users need Renderiq account)
- Or: Paid (if you want to bundle credits)

**Distribution:**
- Public (available to all users)
- Or: Private (invite-only)

### Step 6: Support Information

**Support URL:** https://renderiq.io/support
**Support Email:** support@renderiq.io
**Website:** https://renderiq.io
**Documentation:** https://renderiq.io/docs/sketchup-plugin

### Step 7: Legal & Privacy

**Privacy Policy:**
- API key stored locally in SketchUp model
- Images sent to Renderiq API for processing
- No personal data collected by plugin
- See Renderiq Privacy Policy: https://renderiq.io/privacy

**Terms of Service:**
- Users must agree to Renderiq Terms of Service
- Plugin requires valid Renderiq account
- See Renderiq Terms: https://renderiq.io/terms

### Step 8: Submit for Review

1. Review all information
2. Check all required fields are filled
3. Click **"Submit for Review"**
4. Wait for review (typically 1-2 weeks)

## Review Process

### What Reviewers Check

1. **Functionality**
   - Plugin works as described
   - No crashes or errors
   - Proper error handling

2. **Code Quality**
   - Clean, readable code
   - No malicious code
   - Proper error handling

3. **User Experience**
   - Intuitive interface
   - Clear instructions
   - Helpful error messages

4. **Documentation**
   - Clear description
   - Installation instructions
   - Usage guide

5. **Compatibility**
   - Works on stated platforms
   - Compatible with SketchUp versions

### Common Rejection Reasons

1. **Missing Documentation**
   - Add clear README
   - Include installation instructions
   - Provide usage examples

2. **Poor Error Handling**
   - Add try-catch blocks
   - Show user-friendly error messages
   - Handle network errors gracefully

3. **Missing Features**
   - Ensure all described features work
   - Test thoroughly before submission

4. **Code Issues**
   - Remove debug code
   - Clean up commented code
   - Follow Ruby best practices

## After Approval

1. **Monitor Reviews**
   - Respond to user feedback
   - Address bug reports
   - Update plugin as needed

2. **Update Plugin**
   - Fix bugs
   - Add features
   - Submit updates through developer portal

3. **Marketing**
   - Announce on website
   - Share on social media
   - Create tutorial videos

## Checklist

Before submitting, ensure:

- [ ] Plugin tested on Windows and Mac
- [ ] Tested on all stated SketchUp versions
- [ ] All features work as described
- [ ] Error handling implemented
- [ ] Documentation complete
- [ ] Screenshots prepared
- [ ] Icon created (256x256)
- [ ] RBZ file tested
- [ ] Privacy policy available
- [ ] Support contact information provided
- [ ] Legal requirements met

## Resources

- [Extension Warehouse Developer Guide](https://help.sketchup.com/en/extension-warehouse/developing-extensions)
- [Extension Development Best Practices](https://help.sketchup.com/en/extension-warehouse/extension-development-best-practices)
- [SketchUp Ruby API Documentation](https://ruby.sketchup.com/)
- [Extension Warehouse Submission Form](https://extensions.sketchup.com/developers)

## Support

If you have questions about the submission process:
- Extension Warehouse Support: extensions@sketchup.com
- Renderiq Support: support@renderiq.io

