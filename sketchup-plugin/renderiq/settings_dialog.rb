# Settings Dialog
# UI for configuring render settings

module Renderiq
  module SettingsDialog
    
    # Show settings dialog
    def self.show
      # Get current settings
      settings = get_settings
      
      # Create dialog
      options = {
        :dialog_title => 'Renderiq Settings',
        :preferences_key => 'RenderIQ_Settings',
        :scrollable => true,
        :resizable => true,
        :width => 500,
        :height => 600
      }
      
      dlg = UI::WebDialog.new(options)
      
      html = <<-HTML
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .form-group { margin: 15px 0; }
            label { display: block; margin-bottom: 5px; font-weight: bold; }
            select, input { width: 100%; padding: 8px; box-sizing: border-box; }
            .help-text { font-size: 12px; color: #666; margin-top: 5px; }
            button { padding: 10px 20px; margin: 5px; cursor: pointer; }
            .button-container { text-align: center; margin-top: 20px; }
            .section { border-top: 1px solid #ddd; padding-top: 15px; margin-top: 15px; }
            .section:first-child { border-top: none; }
          </style>
        </head>
        <body>
          <h2>Renderiq Settings</h2>
          
          <div class="section">
            <h3>Project Configuration</h3>
            <div class="form-group">
              <label>Project ID:</label>
              <input type="text" id="projectId" value="#{settings[:project_id] || ''}" placeholder="Enter project ID">
              <div class="help-text">Default project for renders (optional)</div>
            </div>
            <div class="help-text" style="margin-top: 10px; padding: 10px; background: #f0f0f0; border-radius: 5px;">
              <strong>Note:</strong> Authentication is handled separately. Use the "Login" menu item to authenticate.
            </div>
          </div>
          
          <div class="section">
            <h3>Render Settings</h3>
            <div class="form-group">
              <label>Quality:</label>
              <select id="quality">
                <option value="standard" #{'selected' if settings[:quality] == 'standard'}>Standard (1080p) - 5 credits</option>
                <option value="high" #{'selected' if settings[:quality] == 'high' || !settings[:quality]}>High (4K) - 10 credits</option>
                <option value="ultra" #{'selected' if settings[:quality] == 'ultra'}>Ultra (4K Enhanced) - 15 credits</option>
              </select>
            </div>
            <div class="form-group">
              <label>Aspect Ratio:</label>
              <select id="aspectRatio">
                <option value="16:9" #{'selected' if settings[:aspect_ratio] == '16:9' || !settings[:aspect_ratio]}>16:9 (Widescreen)</option>
                <option value="4:3" #{'selected' if settings[:aspect_ratio] == '4:3'}>4:3 (Traditional)</option>
                <option value="1:1" #{'selected' if settings[:aspect_ratio] == '1:1'}>1:1 (Square)</option>
                <option value="9:16" #{'selected' if settings[:aspect_ratio] == '9:16'}>9:16 (Portrait)</option>
              </select>
            </div>
            <div class="form-group">
              <label>Style:</label>
              <select id="style">
                <option value="photorealistic" #{'selected' if settings[:style] == 'photorealistic' || !settings[:style]}>Photorealistic</option>
                <option value="dramatic" #{'selected' if settings[:style] == 'dramatic'}>Dramatic Lighting</option>
                <option value="soft" #{'selected' if settings[:style] == 'soft'}>Soft Lighting</option>
                <option value="studio" #{'selected' if settings[:style] == 'studio'}>Studio Lighting</option>
                <option value="natural" #{'selected' if settings[:style] == 'natural'}>Natural Daylight</option>
              </select>
            </div>
            <div class="form-group">
              <label>AI Model:</label>
              <select id="model">
                <option value="imagen-3.0-generate-001" #{'selected' if settings[:model] == 'imagen-3.0-generate-001' || !settings[:model]}>Imagen 3.0 Standard</option>
                <option value="imagen-3.0-fast-generate-001" #{'selected' if settings[:model] == 'imagen-3.0-fast-generate-001'}>Imagen 3.0 Fast</option>
                <option value="gemini-2.0-flash-exp" #{'selected' if settings[:model] == 'gemini-2.0-flash-exp'}>Gemini 2.0 Flash</option>
              </select>
            </div>
          </div>
          
          <div class="button-container">
            <button onclick="saveSettings()">Save Settings</button>
            <button onclick="sketchup.close()">Cancel</button>
          </div>
          
          <script>
            function saveSettings() {
              var settings = {
                project_id: document.getElementById('projectId').value,
                quality: document.getElementById('quality').value,
                aspect_ratio: document.getElementById('aspectRatio').value,
                style: document.getElementById('style').value,
                model: document.getElementById('model').value
              };
              sketchup.callback('save_settings', JSON.stringify(settings));
              sketchup.close();
            }
          </script>
        </body>
        </html>
      HTML
      
      dlg.set_html(html)
      
      dlg.add_action_callback('save_settings') { |dialog, settings_json|
        settings = JSON.parse(settings_json)
        save_settings(settings)
        UI.messagebox('Settings saved successfully!')
      }
      
      dlg.show
    end
    
    # Get saved settings
    # @return [Hash] Settings hash
    def self.get_settings
      model = Sketchup.active_model
      dict = model.attribute_dictionary('RenderIQ_Settings', true)
      
    {
      project_id: dict['project_id'],
      quality: dict['quality'] || 'high',
      aspect_ratio: dict['aspect_ratio'] || '16:9',
      style: dict['style'] || 'photorealistic',
      model: dict['model'] || 'imagen-3.0-generate-001'
    }
    end
    
    # Save settings
    # @param settings [Hash] Settings to save
    def self.save_settings(settings)
      model = Sketchup.active_model
      dict = model.attribute_dictionary('RenderIQ_Settings', true)
      
      dict['project_id'] = settings['project_id'] || settings[:project_id]
      dict['quality'] = settings['quality'] || settings[:quality]
      dict['aspect_ratio'] = settings['aspect_ratio'] || settings[:aspect_ratio]
      dict['style'] = settings['style'] || settings[:style]
      dict['model'] = settings['model'] || settings[:model]
    end
    
  end
end

