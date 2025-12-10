# Renderiq SketchUp Plugin
# Main plugin file
# Version: 1.0.0

require 'sketchup.rb'
require 'extensions.rb'

# Load plugin modules
unless file_loaded?(__FILE__)
  # Plugin directory
  plugin_dir = File.dirname(__FILE__)
  
  # Load modules
  require File.join(plugin_dir, 'renderiq', 'camera_manager.rb')
  require File.join(plugin_dir, 'renderiq', 'screenshot_capture.rb')
  require File.join(plugin_dir, 'renderiq', 'api_client.rb')
  require File.join(plugin_dir, 'renderiq', 'settings_dialog.rb')
  require File.join(plugin_dir, 'renderiq', 'render_dialog.rb')
  require File.join(plugin_dir, 'renderiq', 'utils.rb')
  
  # Create extension
  extension = SketchupExtension.new('Renderiq AI Renderer', File.join(plugin_dir, 'renderiq', 'loader.rb'))
  extension.description = 'Transform your SketchUp models into photorealistic renders using AI'
  extension.version = '1.0.0'
  extension.copyright = '© 2025 Renderiq'
  extension.creator = 'Renderiq'
  
  # Register extension
  Sketchup.register_extension(extension, true)
  
  file_loaded(__FILE__)
end

