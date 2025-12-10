# Render Dialog
# Shows render progress and results

module Renderiq
  module RenderDialog
    
    # Show render progress dialog
    # @param render_id [String] Render ID
    # @param access_token [String] Access token
    def self.show_progress(render_id, access_token)
      options = {
        :dialog_title => 'Rendering...',
        :preferences_key => 'RenderIQ_Progress',
        :scrollable => false,
        :resizable => false,
        :width => 400,
        :height => 200
      }
      
      dlg = UI::WebDialog.new(options)
      
      html = <<-HTML
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
            .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 20px auto; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            #status { margin-top: 20px; }
            button { padding: 10px 20px; margin: 10px; cursor: pointer; }
          </style>
        </head>
        <body>
          <h3>Generating Render...</h3>
          <div class="spinner"></div>
          <div id="status">Processing your render...</div>
          <button onclick="sketchup.callback('cancel_render'); sketchup.close();">Cancel</button>
        </body>
        </html>
      HTML
      
      dlg.set_html(html)
      
      # Poll for status
      poll_interval = 2000 # 2 seconds
      poll_timer = UI.start_timer(poll_interval, true) {
        status = APIClient.poll_render_status(render_id, access_token)
        
        if status[:success]
          if status[:status] == 'completed' && status[:output_url]
            UI.stop_timer(poll_timer)
            dlg.close
            show_result(status[:output_url])
          elsif status[:status] == 'failed'
            UI.stop_timer(poll_timer)
            dlg.close
            UI.messagebox("Render failed: #{status[:error] || 'Unknown error'}")
          end
        end
      }
      
      dlg.add_action_callback('cancel_render') {
        UI.stop_timer(poll_timer)
      }
      
      dlg.show
    end
    
    # Show render result
    # @param output_url [String] URL to rendered image
    def self.show_result(output_url)
      options = {
        :dialog_title => 'Render Complete',
        :preferences_key => 'RenderIQ_Result',
        :scrollable => true,
        :resizable => true,
        :width => 800,
        :height => 600
      }
      
      dlg = UI::WebDialog.new(options)
      
      html = <<-HTML
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
            img { max-width: 100%; height: auto; border: 1px solid #ddd; }
            button { padding: 10px 20px; margin: 10px; cursor: pointer; }
            .button-container { margin-top: 20px; }
          </style>
        </head>
        <body>
          <h3>Render Complete!</h3>
          <img src="#{output_url}" alt="Rendered image">
          <div class="button-container">
            <button onclick="sketchup.callback('download_image', '#{output_url}');">Download Image</button>
            <button onclick="sketchup.callback('open_in_browser', '#{output_url}');">Open in Browser</button>
            <button onclick="sketchup.close();">Close</button>
          </div>
        </body>
        </html>
      HTML
      
      dlg.set_html(html)
      
      dlg.add_action_callback('download_image') { |dialog, url|
        download_image(url)
      }
      
      dlg.add_action_callback('open_in_browser') { |dialog, url|
        UI.openURL(url)
      }
      
      dlg.show
    end
    
    # Download image
    # @param url [String] Image URL
    def self.download_image(url)
      begin
        require 'net/http'
        require 'uri'
        
        uri = URI(url)
        http = Net::HTTP.new(uri.host, uri.port)
        http.use_ssl = true
        
        request = Net::HTTP::Get.new(uri.path)
        response = http.request(request)
        
        if response.code == '200'
          # Get download directory
          download_dir = UI.savepanel('Save Rendered Image', '', 'render.png')
          return unless download_dir
          
          File.binwrite(download_dir, response.body)
          UI.messagebox("Image saved to #{download_dir}")
        else
          UI.messagebox("Failed to download image: #{response.code}")
        end
      rescue => e
        UI.messagebox("Error downloading image: #{e.message}")
      end
    end
    
  end
end

