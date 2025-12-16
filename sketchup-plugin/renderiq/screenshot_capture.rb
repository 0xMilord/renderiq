# Screenshot Capture
# Handles capturing the current SketchUp view as an image

module Renderiq
  module ScreenshotCapture
    
    # Capture current view as image
    # @param width [Integer] Image width in pixels
    # @param height [Integer] Image height in pixels
    # @param filename [String] Output filename (optional)
    # @return [String] Path to saved image file
    def self.capture_view(width = 1920, height = 1080, filename = nil)
      model = Sketchup.active_model
      view = model.active_view
      
      # Generate filename if not provided
      unless filename
        timestamp = Time.now.strftime('%Y%m%d_%H%M%S')
        filename = "renderiq_capture_#{timestamp}.png"
      end
      
      # Get temp directory
      temp_dir = File.join(Dir.tmpdir, 'renderiq_sketchup')
      Dir.mkdir(temp_dir) unless Dir.exist?(temp_dir)
      
      filepath = File.join(temp_dir, filename)
      
      # Capture image
      # Note: SketchUp's write_image method captures the current view
      # We need to set the viewport size first
      original_size = [view.vpwidth, view.vpheight]
      
      begin
        # Set viewport size (if possible)
        # Note: This may not work in all SketchUp versions
        # Alternative: Use antialiased rendering
        
        # Capture with antialiasing
        options = {
          :antialias => true,
          :compression => 1.0,
          :width => width,
          :height => height
        }
        
        # Write image
        view.write_image(filepath, width, height, options)
        
        return filepath
      rescue => e
        UI.messagebox("Error capturing screenshot: #{e.message}")
        return nil
      end
    end
    
    # Capture view at standard resolution
    # @param quality [String] 'standard', 'high', or 'ultra'
    # @return [String] Path to saved image file
    def self.capture_at_quality(quality = 'high')
      resolutions = {
        'standard' => [1920, 1080],  # 1080p
        'high' => [3840, 2160],      # 4K
        'ultra' => [7680, 4320]      # 8K (may be too large)
      }
      
      width, height = resolutions[quality] || resolutions['high']
      
      # For ultra, limit to 4K to avoid memory issues
      if quality == 'ultra'
        width, height = [3840, 2160]
      end
      
      capture_view(width, height)
    end
    
    # Convert image to base64 for API
    # @param filepath [String] Path to image file
    # @return [String] Base64 encoded image data
    def self.image_to_base64(filepath)
      return nil unless File.exist?(filepath)
      
      begin
        image_data = File.binread(filepath)
        base64_data = [image_data].pack('m0') # Base64 encode
        return base64_data
      rescue => e
        UI.messagebox("Error encoding image: #{e.message}")
        return nil
      end
    end
    
    # Get image MIME type from file extension
    # @param filepath [String] Path to image file
    # @return [String] MIME type
    def self.get_image_type(filepath)
      ext = File.extname(filepath).downcase
      types = {
        '.png' => 'image/png',
        '.jpg' => 'image/jpeg',
        '.jpeg' => 'image/jpeg',
        '.webp' => 'image/webp'
      }
      types[ext] || 'image/png'
    end
    
  end
end








