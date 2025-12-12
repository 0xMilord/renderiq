# Render Dialog
# Shows render progress and results

module Renderiq
  module RenderDialog
    
    # Show render progress dialog
    # @param render_id [String] Render ID
    # @param access_token [String] Access token
    def self.show_progress(render_id, access_token)
      dlg = UIHelper.create_dialog(
        dialog_title: 'Rendering...',
        preferences_key: 'RenderIQ_Progress',
        width: 500,
        height: 300,
        resizable: false
      )
      
      html = <<-HTML
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            #{UIHelper.modern_css}
            body { text-align: center; }
            .spinner {
              border: 4px solid #f3f3f3;
              border-top: 4px solid #667eea;
              border-radius: 50%;
              width: 50px;
              height: 50px;
              animation: spin 1s linear infinite;
              margin: 30px auto;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            #status {
              margin-top: 20px;
              font-size: 16px;
              color: #666;
            }
            .render-id {
              margin-top: 12px;
              font-size: 12px;
              color: #999;
              font-family: monospace;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <h2>⏳ Generating Render...</h2>
              <div class="spinner"></div>
              <div id="status">Processing your render...</div>
              <div class="render-id">ID: #{render_id[0..8]}...</div>
              <button class="btn-secondary" onclick="sketchup.callback('cancel_render'); sketchup.close();" style="margin-top: 24px;">
                Cancel
              </button>
            </div>
          </div>
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
      dlg = UIHelper.create_dialog(
        dialog_title: 'Render Complete',
        preferences_key: 'RenderIQ_Result',
        width: 900,
        height: 700
      )
      
      html = <<-HTML
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            #{UIHelper.modern_css}
            body { text-align: center; }
            img {
              max-width: 100%;
              height: auto;
              border-radius: 12px;
              box-shadow: 0 4px 16px rgba(0,0,0,0.1);
              margin: 20px 0;
            }
            .button-group {
              display: flex;
              gap: 12px;
              margin-top: 20px;
            }
            .button-group button {
              flex: 1;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <h2>✅ Render Complete!</h2>
              <p class="subtitle">Your photorealistic render is ready</p>
              <img src="#{output_url}" alt="Rendered image">
              <div class="button-group">
                <button class="btn-primary" onclick="sketchup.callback('download_image', '#{output_url}');">
                  💾 Download
                </button>
                <button class="btn-secondary" onclick="sketchup.callback('open_in_browser', '#{output_url}');">
                  🌐 Open in Browser
                </button>
              </div>
              <button class="btn-secondary" onclick="sketchup.close();" style="margin-top: 12px;">
                Close
              </button>
            </div>
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

