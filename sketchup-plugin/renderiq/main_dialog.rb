# Main Dialog
# Main interface for capturing and rendering

module Renderiq
  module MainDialog
    
    # Show main dialog
    def self.show
      # Check authentication
      access_token = AuthManager.get_saved_token
      
      unless access_token
        result = UI.messagebox(
          "You need to login to use Renderiq. Would you like to login now?",
          MB_YESNO | MB_ICONQUESTION,
          "Authentication Required"
        )
        
        if result == IDYES
          AuthManager.show_login_dialog
          access_token = AuthManager.get_saved_token
        end
        
        unless access_token
          return
        end
      end
      
      # Create modern dialog using UIHelper
      dlg = UIHelper.create_dialog(
        dialog_title: 'Renderiq - Capture & Render',
        preferences_key: 'RenderIQ_Main',
        width: 600,
        height: 500
      )
      
      html = <<-HTML
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            #{UIHelper.modern_css}
            .option {
              padding: 20px;
              border: 2px solid #e5e5e5;
              margin: 16px 0;
              cursor: pointer;
              border-radius: 12px;
              transition: all 0.2s;
              background: white;
            }
            .option:hover {
              border-color: #667eea;
              background: #f8f9ff;
              transform: translateY(-2px);
              box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
            }
            .option-title {
              font-weight: 600;
              margin-bottom: 6px;
              color: #1a1a1a;
              font-size: 16px;
            }
            .option-desc {
              font-size: 13px;
              color: #666;
              line-height: 1.5;
            }
            .icon {
              display: inline-block;
              margin-right: 8px;
              font-size: 18px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <h2>🎨 Render with Renderiq</h2>
              <p class="subtitle">Transform your SketchUp models into photorealistic renders</p>
              
              <div class="option" onclick="sketchup.callback('capture_render'); sketchup.close();">
                <div class="option-title">
                  <span class="icon">📸</span>
                  Capture Current View & Render
                </div>
                <div class="option-desc">
                  Capture the current view and generate a photorealistic AI render
                </div>
              </div>
              
              <div class="option" onclick="sketchup.callback('open_settings'); sketchup.close();">
                <div class="option-title">
                  <span class="icon">⚙️</span>
                  Settings
                </div>
                <div class="option-desc">
                  Configure render settings, quality, and API preferences
                </div>
              </div>
              
              <button class="btn-primary" onclick="sketchup.callback('capture_render'); sketchup.close();">
                🚀 Start Rendering
              </button>
              <button class="btn-secondary" onclick="sketchup.close();">
                Cancel
              </button>
            </div>
          </div>
        </body>
        </html>
      HTML
      
      dlg.set_html(html)
      
      dlg.add_action_callback('capture_render') {
        capture_and_render
      }
      
      dlg.add_action_callback('open_settings') {
        SettingsDialog.show
      }
      
      dlg.show
    end
    
    # Capture current view and render
    def self.capture_and_render
      # Check authentication
      access_token = AuthManager.get_saved_token
      
      unless access_token
        result = UI.messagebox(
          "You need to login to use Renderiq. Would you like to login now?",
          MB_YESNO | MB_ICONQUESTION,
          "Authentication Required"
        )
        
        if result == IDYES
          AuthManager.show_login_dialog
          access_token = AuthManager.get_saved_token
        end
        
        unless access_token
          UI.messagebox('Please login to continue.')
          return
        end
      end
      
      # Get settings
      settings = SettingsDialog.get_settings
      
      # Check project ID
      unless settings[:project_id] && !settings[:project_id].empty?
        result = UI.inputbox(['Project ID:'], [''], 'Enter Project ID')
        return unless result
        settings[:project_id] = result[0]
        SettingsDialog.save_settings(settings)
      end
      
      # Show progress
      UI.messagebox('Capturing current view...', MB_OK)
      
      # Capture screenshot
      quality = settings[:quality] || 'high'
      image_path = ScreenshotCapture.capture_at_quality(quality)
      
      unless image_path
        UI.messagebox('Failed to capture screenshot.')
        return
      end
      
      # Calculate credits cost
      quality = settings[:quality] || 'high'
      credits_cost = case quality
        when 'standard' then 5
        when 'high' then 10
        when 'ultra' then 15
        else 10
      end
      
      # Check credits before rendering
      credits_check = CreditsManager.check_credits(access_token, credits_cost)
      
      unless credits_check[:success] && credits_check[:has_enough]
        CreditsManager.show_insufficient_credits_dialog(credits_cost, credits_check[:balance] || 0)
        return
      end
      
      # Show render settings dialog (optional quick settings)
      # For now, use saved settings
      
      # Send to API
      UI.messagebox('Sending to Renderiq API...', MB_OK)
      
      render_settings = {
        quality: settings[:quality] || 'high',
        aspect_ratio: settings[:aspect_ratio] || '16:9',
        style: settings[:style] || 'photorealistic',
        model: settings[:model] || 'imagen-3.0-generate-001'
      }
      
      result = APIClient.send_render_request(
        image_path,
        render_settings,
        access_token,
        settings[:project_id]
      )
      
      if result[:success] && result[:render_id]
        # Show progress dialog
        RenderDialog.show_progress(result[:render_id], access_token)
      else
        UI.messagebox("Failed to start render: #{result[:error]}")
      end
    end
    
  end
end

