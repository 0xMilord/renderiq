# API Client
# Handles communication with Renderiq API

require 'net/http'
require 'uri'
require 'json'
require 'base64'

module Renderiq
  module APIClient
    
    # API base URL
    API_BASE_URL = 'https://renderiq.io'
    
    # Send render request to API
    # @param image_path [String] Path to image file
    # @param settings [Hash] Render settings
    # @param access_token [String] Access token (replaces api_key)
    # @param project_id [String] Project ID
    # @return [Hash] Response with render_id and status
    def self.send_render_request(image_path, settings, access_token, project_id)
      # Read and encode image
      image_data = ScreenshotCapture.image_to_base64(image_path)
      return { error: 'Failed to encode image' } unless image_data
      
      image_type = ScreenshotCapture.get_image_type(image_path)
      
      # Build system prompt
      system_prompt = build_system_prompt(settings)
      
      # Send request using FormData (multipart/form-data)
      uri = URI("#{API_BASE_URL}/api/sketchup-extension/renders")
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = true
      http.read_timeout = 300 # 5 minutes
      
      # Build multipart form data
      boundary = "----WebKitFormBoundary#{Time.now.to_i}"
      
      form_parts = []
      form_parts << "--#{boundary}"
      form_parts << "Content-Disposition: form-data; name=\"prompt\""
      form_parts << ""
      form_parts << system_prompt
      
      form_parts << "--#{boundary}"
      form_parts << "Content-Disposition: form-data; name=\"uploadedImageData\""
      form_parts << ""
      form_parts << image_data
      
      form_parts << "--#{boundary}"
      form_parts << "Content-Disposition: form-data; name=\"uploadedImageType\""
      form_parts << ""
      form_parts << image_type
      
      form_parts << "--#{boundary}"
      form_parts << "Content-Disposition: form-data; name=\"projectId\""
      form_parts << ""
      form_parts << project_id
      
      form_parts << "--#{boundary}"
      form_parts << "Content-Disposition: form-data; name=\"imageType\""
      form_parts << ""
      form_parts << "sketchup-to-render"
      
      form_parts << "--#{boundary}"
      form_parts << "Content-Disposition: form-data; name=\"type\""
      form_parts << ""
      form_parts << "image"
      
      form_parts << "--#{boundary}"
      form_parts << "Content-Disposition: form-data; name=\"quality\""
      form_parts << ""
      form_parts << (settings[:quality] || 'high')
      
      form_parts << "--#{boundary}"
      form_parts << "Content-Disposition: form-data; name=\"aspectRatio\""
      form_parts << ""
      form_parts << (settings[:aspect_ratio] || '16:9')
      
      form_parts << "--#{boundary}"
      form_parts << "Content-Disposition: form-data; name=\"style\""
      form_parts << ""
      form_parts << (settings[:style] || 'photorealistic')
      
      if settings[:model]
        form_parts << "--#{boundary}"
        form_parts << "Content-Disposition: form-data; name=\"model\""
        form_parts << ""
        form_parts << settings[:model]
      end
      
      form_parts << "--#{boundary}--"
      
      body = form_parts.join("\r\n")
      
      request = Net::HTTP::Post.new(uri.path)
      request['Content-Type'] = "multipart/form-data; boundary=#{boundary}"
      request['Authorization'] = "Bearer #{access_token}" if access_token
      request.body = body
      
      # Convert to JSON
      request.body = request_data.to_json
      
      begin
        response = http.request(request)
        
        if response.code == '200' || response.code == '201'
          result = JSON.parse(response.body)
          return {
            success: true,
            render_id: result['data'] && result['data']['renderId'] || result['renderId'],
            status: 'processing'
          }
        else
          error_data = JSON.parse(response.body) rescue {}
          return {
            success: false,
            error: error_data['error'] || "API error: #{response.code}"
          }
        end
      rescue => e
        return {
          success: false,
          error: "Network error: #{e.message}"
        }
      end
    end
    
    # Poll for render status
    # @param render_id [String] Render ID
    # @param access_token [String] Access token
    # @return [Hash] Render status and result URL
    def self.poll_render_status(render_id, access_token)
      uri = URI("#{API_BASE_URL}/api/sketchup-extension/renders/#{render_id}")
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = true
      
      request = Net::HTTP::Get.new(uri.path)
      request['Authorization'] = "Bearer #{access_token}" if access_token
      
      begin
        response = http.request(request)
        
        if response.code == '200'
          result = JSON.parse(response.body)
          return {
            success: true,
            status: result['status'] || 'processing',
            output_url: result['outputUrl'],
            error: result['error']
          }
        else
          return {
            success: false,
            error: "API error: #{response.code}"
          }
        end
      rescue => e
        return {
          success: false,
          error: "Network error: #{e.message}"
        }
      end
    end
    
    # Build system prompt from settings
    # @param settings [Hash] Render settings
    # @return [String] System prompt
    def self.build_system_prompt(settings)
      style = settings[:style] || 'photorealistic'
      
      style_descriptions = {
        'photorealistic' => 'photorealistic architectural render with realistic materials, textures, lighting, and environmental context',
        'dramatic' => 'dramatic architectural render with strong lighting contrasts, deep shadows, and cinematic quality',
        'soft' => 'soft architectural render with gentle, diffused lighting and even illumination',
        'studio' => 'studio-quality architectural render with controlled lighting and professional presentation',
        'natural' => 'natural daylight architectural render with realistic sun position and ambient lighting'
      }
      
      style_desc = style_descriptions[style] || style_descriptions['photorealistic']
      
      prompt = <<~PROMPT
        You are an expert architectural visualizer specializing in transforming 3D model screenshots into #{style_desc}.

        Transform this SketchUp 3D model screenshot into a #{style_desc} with:
        - Realistic materials and textures
        - Natural lighting and shadows
        - Professional architectural presentation quality
        - Accurate perspective and proportions
        - Enhanced environmental context
        - Photorealistic detail and depth

        Maintain the architectural design integrity while enhancing realism and visual appeal.
      PROMPT
      
      prompt.strip
    end
    
  end
end

