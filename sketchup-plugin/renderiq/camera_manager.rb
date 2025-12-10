# Camera Position Manager
# Handles saving, loading, and managing camera positions

module Renderiq
  module CameraManager
    
    # Save current camera position
    def self.save_current_position
      model = Sketchup.active_model
      view = model.active_view
      camera = view.camera
      
      # Get position name from user
      prompts = ['Camera Position Name:']
      defaults = ["Camera #{Time.now.strftime('%Y%m%d_%H%M%S')}"]
      input = UI.inputbox(prompts, defaults, 'Save Camera Position')
      
      return unless input
      
      position_name = input[0]
      return if position_name.empty?
      
      # Get camera data
      eye = camera.eye
      target = camera.target
      up = camera.up
      perspective = camera.perspective?
      fov = camera.fov if camera.perspective?
      height = camera.height unless camera.perspective?
      
      # Store in model attributes
      dict_name = 'RenderIQ_CameraPositions'
      dict = model.attribute_dictionary(dict_name, true)
      
      # Create position data
      position_data = {
        'eye' => [eye.x, eye.y, eye.z],
        'target' => [target.x, target.y, target.z],
        'up' => [up.x, up.y, up.z],
        'perspective' => perspective,
        'fov' => fov,
        'height' => height,
        'created_at' => Time.now.to_s
      }
      
      # Save position
      dict[position_name] = position_data.to_json
      
      UI.messagebox("Camera position '#{position_name}' saved successfully!")
    end
    
    # Load camera position
    def self.load_position(position_name)
      model = Sketchup.active_model
      view = model.active_view
      
      dict = model.attribute_dictionary('RenderIQ_CameraPositions')
      return false unless dict
      
      position_json = dict[position_name]
      return false unless position_json
      
      begin
        position_data = JSON.parse(position_json)
        
        # Create camera
        eye = Geom::Point3d.new(position_data['eye'])
        target = Geom::Point3d.new(position_data['target'])
        up = Geom::Vector3d.new(position_data['up'])
        
        camera = view.camera
        camera.set(eye, target, up)
        
        if position_data['perspective']
          camera.perspective = true
          camera.fov = position_data['fov'] if position_data['fov']
        else
          camera.perspective = false
          camera.height = position_data['height'] if position_data['height']
        end
        
        view.camera = camera
        view.refresh
        
        return true
      rescue => e
        UI.messagebox("Error loading camera position: #{e.message}")
        return false
      end
    end
    
    # Show dialog to load camera position
    def self.load_position_dialog
      positions = get_saved_positions
      
      if positions.empty?
        UI.messagebox('No saved camera positions found.')
        return
      end
      
      # Create dialog
      options = {
        :dialog_title => 'Load Camera Position',
        :preferences_key => 'RenderIQ_LoadCamera',
        :scrollable => false,
        :resizable => false,
        :width => 300,
        :height => 200
      }
      
      dlg = UI::WebDialog.new(options)
      
      html = <<-HTML
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            select { width: 100%; padding: 8px; margin: 10px 0; }
            button { padding: 10px 20px; margin: 5px; cursor: pointer; }
            .button-container { text-align: center; margin-top: 20px; }
          </style>
        </head>
        <body>
          <h3>Select Camera Position</h3>
          <select id="positionSelect">
            #{positions.map { |name| "<option value=\"#{name}\">#{name}</option>" }.join}
          </select>
          <div class="button-container">
            <button onclick="loadPosition()">Load</button>
            <button onclick="sketchup.close()">Cancel</button>
          </div>
          <script>
            function loadPosition() {
              var select = document.getElementById('positionSelect');
              var positionName = select.value;
              sketchup.callback('load_position', positionName);
              sketchup.close();
            }
          </script>
        </body>
        </html>
      HTML
      
      dlg.set_html(html)
      
      dlg.add_action_callback('load_position') { |dialog, position_name|
        if load_position(position_name)
          UI.messagebox("Camera position '#{position_name}' loaded successfully!")
        end
      }
      
      dlg.show
    end
    
    # Show dialog to manage camera positions
    def self.manage_positions_dialog
      positions = get_saved_positions
      
      if positions.empty?
        UI.messagebox('No saved camera positions found.')
        return
      end
      
      # Create dialog
      options = {
        :dialog_title => 'Manage Camera Positions',
        :preferences_key => 'RenderIQ_ManageCameras',
        :scrollable => true,
        :resizable => true,
        :width => 400,
        :height => 400
      }
      
      dlg = UI::WebDialog.new(options)
      
      html = <<-HTML
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .position-item { padding: 10px; border-bottom: 1px solid #ddd; }
            .position-name { font-weight: bold; }
            button { padding: 5px 10px; margin: 2px; cursor: pointer; }
          </style>
        </head>
        <body>
          <h3>Saved Camera Positions</h3>
          <div id="positionsList">
            #{positions.map { |name| 
              "<div class='position-item'>
                <span class='position-name'>#{name}</span>
                <button onclick='loadPosition(\"#{name}\")'>Load</button>
                <button onclick='deletePosition(\"#{name}\")'>Delete</button>
              </div>"
            }.join}
          </div>
          <div style='text-align: center; margin-top: 20px;'>
            <button onclick='sketchup.close()'>Close</button>
          </div>
          <script>
            function loadPosition(name) {
              sketchup.callback('load_position', name);
              sketchup.close();
            }
            function deletePosition(name) {
              if (confirm('Delete camera position: ' + name + '?')) {
                sketchup.callback('delete_position', name);
                location.reload();
              }
            }
          </script>
        </body>
        </html>
      HTML
      
      dlg.set_html(html)
      
      dlg.add_action_callback('load_position') { |dialog, position_name|
        if load_position(position_name)
          UI.messagebox("Camera position '#{position_name}' loaded successfully!")
        end
        dlg.close
      }
      
      dlg.add_action_callback('delete_position') { |dialog, position_name|
        delete_position(position_name)
        manage_positions_dialog # Refresh dialog
      }
      
      dlg.show
    end
    
    # Get list of saved camera positions
    def self.get_saved_positions
      model = Sketchup.active_model
      dict = model.attribute_dictionary('RenderIQ_CameraPositions')
      return [] unless dict
      
      positions = []
      dict.each { |key, value|
        positions << key unless key.start_with?('_')
      }
      
      positions.sort
    end
    
    # Delete camera position
    def self.delete_position(position_name)
      model = Sketchup.active_model
      dict = model.attribute_dictionary('RenderIQ_CameraPositions')
      return false unless dict
      
      if dict.delete_key(position_name)
        UI.messagebox("Camera position '#{position_name}' deleted successfully!")
        return true
      else
        UI.messagebox("Camera position '#{position_name}' not found.")
        return false
      end
    end
    
  end
end

