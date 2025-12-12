# UI Helper
# Provides utilities for creating modern HTMLDialogs with fallback support

module Renderiq
  module UIHelper
    
    # Check if HTMLDialog is available (SketchUp 2017+)
    # @return [Boolean] True if available
    def self.html_dialog_available?
      Sketchup.version.split('.').first.to_i >= 17 rescue false
    end
    
    # Create a dialog (HTMLDialog if available, otherwise WebDialog)
    # @param options [Hash] Dialog options
    # @return [UI::HtmlDialog or UI::WebDialog] Dialog instance
    def self.create_dialog(options = {})
      if html_dialog_available?
        create_html_dialog(options)
      else
        create_web_dialog(options)
      end
    end
    
    # Create modern HTMLDialog (Chromium-based)
    # @param options [Hash] Dialog options
    # @return [UI::HtmlDialog] Dialog instance
    def self.create_html_dialog(options = {})
      default_options = {
        dialog_title: 'Renderiq',
        preferences_key: 'RenderIQ',
        scrollable: true,
        resizable: true,
        width: 600,
        height: 500,
        min_width: 400,
        min_height: 400,
        style: UI::HtmlDialog::STYLE_DIALOG
      }
      
      merged_options = default_options.merge(options)
      
      UI::HtmlDialog.new(
        dialog_title: merged_options[:dialog_title],
        preferences_key: merged_options[:preferences_key],
        scrollable: merged_options[:scrollable],
        resizable: merged_options[:resizable],
        width: merged_options[:width],
        height: merged_options[:height],
        min_width: merged_options[:min_width],
        min_height: merged_options[:min_height],
        max_width: merged_options[:max_width],
        max_height: merged_options[:max_height],
        style: merged_options[:style] || UI::HtmlDialog::STYLE_DIALOG
      )
    end
    
    # Create legacy WebDialog (fallback for SketchUp < 2017)
    # @param options [Hash] Dialog options
    # @return [UI::WebDialog] Dialog instance
    def self.create_web_dialog(options = {})
      default_options = {
        :dialog_title => 'Renderiq',
        :preferences_key => 'RenderIQ',
        :scrollable => false,
        :resizable => false,
        :width => 400,
        :height => 300
      }
      
      merged_options = default_options.merge(options)
      
      UI::WebDialog.new(merged_options)
    end
    
    # Get modern CSS styles
    # @return [String] CSS string
    def self.modern_css
      <<-CSS
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
                       'Helvetica Neue', Arial, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 24px;
          min-height: 100vh;
        }
        
        .container {
          max-width: 600px;
          margin: 0 auto;
        }
        
        .card {
          background: white;
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        
        h2 {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 8px;
          color: #1a1a1a;
        }
        
        .subtitle {
          color: #666;
          margin-bottom: 24px;
          font-size: 14px;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        label {
          display: block;
          font-weight: 600;
          margin-bottom: 8px;
          color: #333;
          font-size: 14px;
        }
        
        input, select {
          width: 100%;
          padding: 12px;
          border: 2px solid #e5e5e5;
          border-radius: 8px;
          font-size: 14px;
          background: white;
          transition: border-color 0.2s;
        }
        
        input:focus, select:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        button {
          padding: 14px 28px;
          border: none;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          width: 100%;
          margin-top: 8px;
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        
        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }
        
        .btn-secondary {
          background: #f5f5f5;
          color: #666;
        }
        
        .btn-secondary:hover {
          background: #e5e5e5;
        }
        
        .error {
          color: #e74c3c;
          font-size: 14px;
          margin-top: 8px;
          padding: 12px;
          background: #ffeaea;
          border-radius: 8px;
          display: none;
        }
        
        .error.show {
          display: block;
        }
        
        .link {
          color: #667eea;
          text-decoration: none;
          font-size: 13px;
        }
        
        .link:hover {
          text-decoration: underline;
        }
        
        .section {
          border-top: 1px solid #eee;
          padding-top: 20px;
          margin-top: 20px;
        }
        
        .section:first-child {
          border-top: none;
          padding-top: 0;
          margin-top: 0;
        }
      CSS
    end
    
  end
end


