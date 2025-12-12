# Authentication Manager
# Handles user authentication and session management

require 'net/http'
require 'uri'
require 'json'
require 'base64'

module Renderiq
  module AuthManager
    
    # API base URL
    API_BASE_URL = 'https://renderiq.io'
    
    # Authenticate user with email and password
    # @param email [String] User email
    # @param password [String] User password
    # @return [Hash] Authentication result with access_token and user info
    def self.authenticate(email, password)
      uri = URI("#{API_BASE_URL}/api/plugins/auth/signin")
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = true
      
      request = Net::HTTP::Post.new(uri.path)
      request['Content-Type'] = 'application/json'
      request['X-Renderiq-Platform'] = 'sketchup'
      
      request_data = {
        email: email,
        password: password
      }
      
      request.body = request_data.to_json
      
      begin
        response = http.request(request)
        
        if response.code == '200'
          result = JSON.parse(response.body)
          return {
            success: true,
            access_token: result['access_token'] || result['token'],
            user: result['user'],
            expires_at: result['expires_at']
          }
        else
          error_data = JSON.parse(response.body) rescue {}
          return {
            success: false,
            error: error_data['error'] || "Authentication failed: #{response.code}"
          }
        end
      rescue => e
        return {
          success: false,
          error: "Network error: #{e.message}"
        }
      end
    end
    
    # Get user info from access token
    # @param access_token [String] Access token
    # @return [Hash] User info
    def self.get_user_info(access_token)
      uri = URI("#{API_BASE_URL}/api/plugins/auth/me")
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = true
      
      request = Net::HTTP::Get.new(uri.path)
      request['Authorization'] = "Bearer #{access_token}"
      request['X-Renderiq-Platform'] = 'sketchup'
      
      begin
        response = http.request(request)
        
        if response.code == '200'
          result = JSON.parse(response.body)
          return {
            success: true,
            user: result['user'] || result
          }
        else
          return {
            success: false,
            error: "Failed to get user info: #{response.code}"
          }
        end
      rescue => e
        return {
          success: false,
          error: "Network error: #{e.message}"
        }
      end
    end
    
    # Check if access token is valid
    # @param access_token [String] Access token
    # @return [Boolean] True if valid
    def self.validate_token(access_token)
      result = get_user_info(access_token)
      result[:success]
    end
    
    # Save access token securely
    # @param access_token [String] Access token
    # @param user_id [String] User ID
    def self.save_token(access_token, user_id)
      model = Sketchup.active_model
      dict = model.attribute_dictionary('RenderIQ_Auth', true)
      
      # Store token (in production, should be encrypted)
      dict['access_token'] = access_token
      dict['user_id'] = user_id
      dict['saved_at'] = Time.now.to_s
    end
    
    # Get saved access token
    # @return [String, nil] Access token or nil
    def self.get_saved_token
      model = Sketchup.active_model
      dict = model.attribute_dictionary('RenderIQ_Auth')
      return nil unless dict
      
      token = dict['access_token']
      return nil unless token
      
      # Validate token is still valid
      if validate_token(token)
        return token
      else
        # Token expired, clear it
        dict.delete_key('access_token')
        dict.delete_key('user_id')
        return nil
      end
    end
    
    # Clear saved token (logout)
    def self.clear_token
      model = Sketchup.active_model
      dict = model.attribute_dictionary('RenderIQ_Auth')
      return unless dict
      
      dict.delete_key('access_token')
      dict.delete_key('user_id')
      dict.delete_key('saved_at')
    end
    
    # Show login dialog
    def self.show_login_dialog
      dlg = UIHelper.create_dialog(
        dialog_title: 'Renderiq Login',
        preferences_key: 'RenderIQ_Login',
        width: 450,
        height: 450
      )
      
      html = <<-HTML
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            #{UIHelper.modern_css}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <h2>🔐 Login to Renderiq</h2>
              <p class="subtitle">Sign in to your Renderiq account</p>
          <div id="error" class="error" style="display: none;"></div>
          
          <div class="form-group">
            <label>Email:</label>
            <input type="email" id="email" placeholder="your@email.com">
          </div>
          
          <div class="form-group">
            <label>Password:</label>
            <input type="password" id="password" placeholder="Enter your password">
          </div>
          
              <button class="btn-primary" onclick="login()">🔓 Login</button>
              <div style="text-align: center; margin-top: 16px;">
                <a href="https://renderiq.io/signup" target="_blank" class="link">Don't have an account? Sign up</a>
              </div>
              <div style="text-align: center; margin-top: 8px;">
                <a href="https://renderiq.io/forgot-password" target="_blank" class="link">Forgot password?</a>
              </div>
            </div>
          </div>
          
          <script>
            function login() {
              var email = document.getElementById('email').value;
              var password = document.getElementById('password').value;
              var errorDiv = document.getElementById('error');
              
              if (!email || !password) {
                errorDiv.textContent = 'Please enter email and password';
                errorDiv.style.display = 'block';
                return;
              }
              
              errorDiv.style.display = 'none';
              sketchup.callback('do_login', email, password);
            }
          </script>
        </body>
        </html>
      HTML
      
      dlg.set_html(html)
      
      dlg.add_action_callback('do_login') { |dialog, email, password|
        result = authenticate(email, password)
        
        if result[:success]
          save_token(result[:access_token], result[:user]['id'])
          dlg.close
          UI.messagebox("Successfully logged in as #{result[:user]['email']}!")
          return true
        else
          # Show error in dialog
          dlg.execute_script("document.getElementById('error').textContent = '#{result[:error]}'; document.getElementById('error').style.display = 'block';")
        end
      }
      
      dlg.show
    end
    
  end
end

