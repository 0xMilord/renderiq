# Utility Functions

module Renderiq
  module Utils
    
    # Show about dialog
    def self.show_about_dialog
      options = {
        :dialog_title => 'About Renderiq',
        :preferences_key => 'RenderIQ_About',
        :scrollable => false,
        :resizable => false,
        :width => 400,
        :height => 300
      }
      
      dlg = UI::WebDialog.new(options)
      
      html = <<-HTML
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
            h2 { color: #3498db; }
            p { line-height: 1.6; }
            a { color: #3498db; text-decoration: none; }
            a:hover { text-decoration: underline; }
          </style>
        </head>
        <body>
          <h2>Renderiq AI Renderer</h2>
          <p><strong>Version 1.0.0</strong></p>
          <p>Transform your SketchUp models into photorealistic renders using AI.</p>
          <p>
            <a href="https://renderiq.io" target="_blank">Visit Renderiq</a><br>
            <a href="https://renderiq.io/docs" target="_blank">Documentation</a><br>
            <a href="mailto:support@renderiq.io">Support</a>
          </p>
          <p style="margin-top: 20px; font-size: 12px; color: #666;">
            © 2025 Renderiq. All rights reserved.
          </p>
        </body>
        </html>
      HTML
      
      dlg.set_html(html)
      dlg.show
    end
    
  end
end

