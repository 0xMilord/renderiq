# Utility Functions

module Renderiq
  module Utils
    
    # Show about dialog
    def self.show_about_dialog
      dlg = UIHelper.create_dialog(
        dialog_title: 'About Renderiq',
        preferences_key: 'RenderIQ_About',
        width: 500,
        height: 400
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
            .logo {
              font-size: 64px;
              margin: 20px 0;
            }
            .version {
              font-size: 18px;
              font-weight: 600;
              color: #667eea;
              margin: 12px 0;
            }
            .links {
              margin: 24px 0;
            }
            .links a {
              display: block;
              margin: 8px 0;
              font-size: 15px;
            }
            .copyright {
              margin-top: 24px;
              padding-top: 20px;
              border-top: 1px solid #eee;
              font-size: 12px;
              color: #999;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="logo">🎨</div>
              <h2>Renderiq AI Renderer</h2>
              <div class="version">Version 2.0.0</div>
              <p class="subtitle">Transform your SketchUp models into photorealistic renders using AI.</p>
              <div class="links">
                <a href="https://renderiq.io" target="_blank" class="link">🌐 Visit Renderiq</a>
                <a href="https://renderiq.io/docs" target="_blank" class="link">📚 Documentation</a>
                <a href="mailto:support@renderiq.io" class="link">✉️ Support</a>
              </div>
              <div class="copyright">
                © 2025 Renderiq. All rights reserved.
              </div>
            </div>
          </div>
        </body>
        </html>
      HTML
      
      dlg.set_html(html)
      dlg.show
    end
    
  end
end

