# Renderiq Plugin Loader
# This file is loaded when the extension is enabled

unless file_loaded?(__FILE__)
  # Plugin directory
  plugin_dir = File.dirname(File.dirname(__FILE__))
  
  # Add menu items
  menu = UI.menu('Extensions')
  submenu = menu.add_submenu('Renderiq')
  
  # Main menu items
  submenu.add_item('Capture & Render') {
    Renderiq::MainDialog.show
  }
  
  submenu.add_separator
  
  submenu.add_item('Save Camera Position') {
    Renderiq::CameraManager.save_current_position
  }
  
  submenu.add_item('Load Camera Position') {
    Renderiq::CameraManager.load_position_dialog
  }
  
  submenu.add_item('Manage Camera Positions') {
    Renderiq::CameraManager.manage_positions_dialog
  }
  
  submenu.add_separator
  
  submenu.add_item('Login') {
    Renderiq::AuthManager.show_login_dialog
  }
  
  submenu.add_item('Logout') {
    Renderiq::AuthManager.clear_token
    UI.messagebox('Logged out successfully!')
  }
  
  submenu.add_separator
  
  submenu.add_item('Credits Balance') {
    token = Renderiq::AuthManager.get_saved_token
    if token
      Renderiq::CreditsManager.show_credits_dialog(token)
    else
      UI.messagebox('Please login first to view credits.')
    end
  }
  
  submenu.add_separator
  
  submenu.add_item('Settings') {
    Renderiq::SettingsDialog.show
  }
  
  submenu.add_item('About Renderiq') {
    Renderiq::Utils.show_about_dialog
  }
  
  # Add toolbar
  toolbar = UI::Toolbar.new('Renderiq')
  
  # Capture & Render button
  cmd = UI::Command.new('Capture & Render') {
    Renderiq::MainDialog.show
  }
  cmd.small_icon = File.join(plugin_dir, 'resources', 'icons', 'renderiq_16.png')
  cmd.large_icon = File.join(plugin_dir, 'resources', 'icons', 'renderiq_24.png')
  cmd.tooltip = 'Capture current view and render with AI'
  cmd.status_bar_text = 'Capture current view and generate photorealistic render'
  toolbar.add_item(cmd)
  
  # Save Camera button
  cmd = UI::Command.new('Save Camera') {
    Renderiq::CameraManager.save_current_position
  }
  cmd.small_icon = File.join(plugin_dir, 'resources', 'icons', 'camera_save_16.png')
  cmd.large_icon = File.join(plugin_dir, 'resources', 'icons', 'camera_save_24.png')
  cmd.tooltip = 'Save current camera position'
  cmd.status_bar_text = 'Save current camera position for later use'
  toolbar.add_item(cmd)
  
  toolbar.show
  
  file_loaded(__FILE__)
end

