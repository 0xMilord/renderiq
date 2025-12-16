# SketchUp 2025+ Compatibility Guide

## Overview

This document outlines compatibility requirements and best practices for SketchUp extensions targeting SketchUp 2025 and future versions.

## SketchUp Version Support

### Supported Versions
- ✅ SketchUp 2020
- ✅ SketchUp 2021
- ✅ SketchUp 2022
- ✅ SketchUp 2023
- ✅ SketchUp 2024
- ✅ SketchUp 2025 (target)

### Ruby Version Compatibility

| SketchUp Version | Ruby Version | Notes |
|-----------------|--------------|-------|
| 2020 | 2.7.0 | Standard library changes |
| 2021 | 2.7.0 | Minor updates |
| 2022 | 2.7.0 | Stability improvements |
| 2023 | 2.7.0 | Performance updates |
| 2024 | 2.7.0 | Bug fixes |
| 2025 | 2.7.0+ | Expected to maintain compatibility |

## Key Compatibility Considerations

### 1. Ruby API Stability

The SketchUp Ruby API has remained stable across versions. However, consider:

- **Deprecated Methods**: Some methods may be deprecated but still work
- **New Methods**: New versions may add methods, but old code should still work
- **Behavior Changes**: Minor behavior changes may occur in edge cases

### 2. Extension Structure

```ruby
# ✅ CORRECT: Namespace your code
module Renderiq
  module CameraManager
    # Your code here
  end
end

# ❌ AVOID: Global namespace pollution
def save_camera
  # This can conflict with other extensions
end
```

### 3. File Loading

```ruby
# ✅ CORRECT: Use file_loaded? to prevent double-loading
unless file_loaded?(__FILE__)
  # Extension initialization code
  file_loaded(__FILE__)
end

# ✅ CORRECT: Load dependencies properly
plugin_dir = File.dirname(__FILE__)
require File.join(plugin_dir, 'renderiq', 'camera_manager.rb')
```

### 4. UI Components

#### WebDialog (Recommended for 2020+)
```ruby
# ✅ CORRECT: Modern WebDialog usage
options = {
  :dialog_title => 'My Dialog',
  :preferences_key => 'MyExtension_Dialog',
  :scrollable => true,
  :resizable => true,
  :width => 400,
  :height => 300
}

dlg = UI::WebDialog.new(options)
dlg.set_html(html_content)
dlg.show
```

#### Inputbox (Legacy, but still supported)
```ruby
# ✅ STILL WORKS: Inputbox for simple inputs
prompts = ['Enter name:', 'Enter value:']
defaults = ['Default Name', 'Default Value']
input = UI.inputbox(prompts, defaults, 'Title')
```

### 5. Model Attributes

```ruby
# ✅ CORRECT: Use attribute dictionaries
model = Sketchup.active_model
dict = model.attribute_dictionary('MyExtension_Data', true)
dict['key'] = 'value'

# ✅ CORRECT: Check for existence
dict = model.attribute_dictionary('MyExtension_Data')
if dict
  value = dict['key']
end
```

### 6. Error Handling

```ruby
# ✅ CORRECT: Comprehensive error handling
begin
  # Your code
rescue => e
  UI.messagebox("Error: #{e.message}")
  logger.error("Error details: #{e.inspect}")
end
```

### 7. Thread Safety

```ruby
# ⚠️ IMPORTANT: SketchUp Ruby is single-threaded
# Use UI.start_timer for async operations
UI.start_timer(2.0, false) {
  # This runs after 2 seconds
  # Good for polling, delayed operations
}
```

## Best Practices for 2025+

### 1. Use Modern Ruby Features (Carefully)

```ruby
# ✅ SAFE: Hash shorthand (Ruby 2.7+)
settings = {
  quality: 'high',
  style: 'photorealistic'
}

# ✅ SAFE: Safe navigation (if available)
value = dict&.[]('key')

# ⚠️ AVOID: Very new Ruby features that may not be available
```

### 2. Extension Registration

```ruby
# ✅ CORRECT: Proper extension registration
extension = SketchupExtension.new('My Extension', 'loader.rb')
extension.description = 'Extension description'
extension.version = '1.0.0'
extension.copyright = '© 2025 Company'
extension.creator = 'Company Name'

Sketchup.register_extension(extension, true)
```

### 3. Menu and Toolbar Creation

```ruby
# ✅ CORRECT: Check for existing menus
menu = UI.menu('Extensions')
submenu = menu.add_submenu('My Extension')

# ✅ CORRECT: Add toolbar
toolbar = UI::Toolbar.new('My Extension')
cmd = UI::Command.new('My Command') { do_something }
toolbar.add_item(cmd)
toolbar.show
```

### 4. File I/O

```ruby
# ✅ CORRECT: Use proper file paths
plugin_dir = File.dirname(__FILE__)
file_path = File.join(plugin_dir, 'data', 'file.txt')

# ✅ CORRECT: Handle file operations safely
begin
  File.write(file_path, content)
rescue => e
  UI.messagebox("Failed to write file: #{e.message}")
end
```

### 5. Network Requests

```ruby
# ✅ CORRECT: Use Net::HTTP with proper error handling
require 'net/http'
require 'uri'

begin
  uri = URI('https://api.example.com/endpoint')
  http = Net::HTTP.new(uri.host, uri.port)
  http.use_ssl = true
  http.read_timeout = 30
  
  request = Net::HTTP::Get.new(uri.path)
  response = http.request(request)
  
  if response.code == '200'
    # Handle success
  else
    # Handle error
  end
rescue => e
  UI.messagebox("Network error: #{e.message}")
end
```

## Testing Checklist

Before releasing for SketchUp 2025:

- [ ] Test on SketchUp 2020
- [ ] Test on SketchUp 2021
- [ ] Test on SketchUp 2022
- [ ] Test on SketchUp 2023
- [ ] Test on SketchUp 2024
- [ ] Test on SketchUp 2025 (when available)
- [ ] Test on Windows
- [ ] Test on Mac
- [ ] Test with different Ruby console versions
- [ ] Test error handling
- [ ] Test with other extensions installed
- [ ] Test with large models
- [ ] Test with empty models
- [ ] Test network connectivity issues
- [ ] Test authentication flows
- [ ] Test file I/O operations

## Common Issues and Solutions

### Issue: Extension doesn't load
**Solution**: Check file paths, ensure all required files are in RBZ, verify extension registration

### Issue: Methods not found
**Solution**: Check SketchUp version compatibility, use feature detection

### Issue: UI dialogs not showing
**Solution**: Ensure WebDialog is properly initialized, check HTML content

### Issue: Network requests failing
**Solution**: Check SSL/TLS settings, verify timeout values, handle errors gracefully

### Issue: Model attributes not persisting
**Solution**: Ensure attribute dictionary is created with `true` parameter, save model after changes

## Resources

- [SketchUp Ruby API Documentation](https://ruby.sketchup.com/)
- [Extension Development Guide](https://developer.sketchup.com/)
- [Extension Warehouse Guidelines](https://help.sketchup.com/en/extension-warehouse/developing-extensions)
- [Ruby 2.7 Documentation](https://docs.ruby-lang.org/en/2.7.0/)

## Version-Specific Notes

### SketchUp 2025 (Expected)
- Ruby 2.7.0+ expected
- Continued WebDialog support
- Enhanced security features
- Improved performance

### SketchUp 2024
- Stable Ruby 2.7.0
- WebDialog improvements
- Better error messages

### SketchUp 2023
- Performance improvements
- Bug fixes
- API stability

## Migration Guide

If updating from older versions:

1. **Review Deprecated Methods**: Check for any deprecated API calls
2. **Update Error Handling**: Use modern error handling patterns
3. **Test Thoroughly**: Test on all supported versions
4. **Update Documentation**: Document any version-specific behavior
5. **Version Bump**: Update extension version number

## Conclusion

The Renderiq SketchUp plugin is designed to be compatible with SketchUp 2020 through 2025+. By following these best practices and testing guidelines, the extension should work reliably across all supported versions.








