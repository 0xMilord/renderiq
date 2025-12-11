# Credits Manager
# Handles credit checking and billing

require 'net/http'
require 'uri'
require 'json'

module Renderiq
  module CreditsManager
    
    # API base URL
    API_BASE_URL = 'https://renderiq.io'
    
    # Get user credits balance
    # @param access_token [String] Access token
    # @return [Hash] Credits info
    def self.get_credits(access_token)
      uri = URI("#{API_BASE_URL}/api/plugins/credits")
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = true
      
      request = Net::HTTP::Get.new(uri.path)
      request['Authorization'] = "Bearer #{access_token}"
      request['X-Renderiq-Platform'] = 'sketchup'
      
      begin
        response = http.request(request)
        
        if response.code == '200'
          result = JSON.parse(response.body)
          # Handle unified API response format
          credits_data = result['data'] || result['credits'] || result
          return {
            success: true,
            balance: credits_data['balance'] || 0,
            total_earned: credits_data['totalEarned'] || credits_data['total_earned'] || 0,
            total_spent: credits_data['totalSpent'] || credits_data['total_spent'] || 0
          }
        else
          error_data = JSON.parse(response.body) rescue {}
          return {
            success: false,
            error: error_data['error'] || "Failed to get credits: #{response.code}",
            balance: 0
          }
        end
      rescue => e
        return {
          success: false,
          error: "Network error: #{e.message}",
          balance: 0
        }
      end
    end
    
    # Check if user has enough credits
    # @param access_token [String] Access token
    # @param required_credits [Integer] Required credits
    # @return [Hash] Check result
    def self.check_credits(access_token, required_credits)
      credits_info = get_credits(access_token)
      
      return credits_info unless credits_info[:success]
      
      has_enough = credits_info[:balance] >= required_credits
      
      {
        success: true,
        has_enough: has_enough,
        balance: credits_info[:balance],
        required: required_credits,
        shortfall: has_enough ? 0 : (required_credits - credits_info[:balance])
      }
    end
    
    # Show credits dialog
    # @param access_token [String] Access token
    def self.show_credits_dialog(access_token)
      credits_info = get_credits(access_token)
      
      options = {
        :dialog_title => 'Renderiq Credits',
        :preferences_key => 'RenderIQ_Credits',
        :scrollable => false,
        :resizable => false,
        :width => 400,
        :height => 300
      }
      
      dlg = UI::WebDialog.new(options)
      
      balance = credits_info[:success] ? credits_info[:balance] : 0
      is_low = balance < 5
      
      html = <<-HTML
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
            .balance { font-size: 48px; font-weight: bold; color: #{is_low ? '#e74c3c' : '#27ae60'}; margin: 20px 0; }
            .label { font-size: 14px; color: #666; margin-bottom: 10px; }
            .warning { color: #e74c3c; font-size: 12px; margin: 10px 0; }
            button { padding: 10px 20px; margin: 5px; cursor: pointer; }
            .button-container { margin-top: 20px; }
            .stats { margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <h2>Your Credits</h2>
          <div class="label">Available Balance</div>
          <div class="balance">#{balance}</div>
          #{is_low ? '<div class="warning">⚠️ Low credits! Consider topping up.</div>' : ''}
          
          <div class="stats">
            <div>Total Earned: #{credits_info[:total_earned] || 0}</div>
            <div>Total Spent: #{credits_info[:total_spent] || 0}</div>
          </div>
          
          <div class="button-container">
            <button onclick="sketchup.callback('topup'); sketchup.close();">Top Up Credits</button>
            <button onclick="sketchup.callback('refresh'); location.reload();">Refresh</button>
            <button onclick="sketchup.close();">Close</button>
          </div>
        </body>
        </html>
      HTML
      
      dlg.set_html(html)
      
      dlg.add_action_callback('topup') {
        UI.openURL('https://renderiq.io/pricing')
      }
      
      dlg.add_action_callback('refresh') {
        show_credits_dialog(access_token)
      }
      
      dlg.show
    end
    
    # Show insufficient credits dialog
    # @param required [Integer] Required credits
    # @param balance [Integer] Current balance
    def self.show_insufficient_credits_dialog(required, balance)
      shortfall = required - balance
      
      options = {
        :dialog_title => 'Insufficient Credits',
        :preferences_key => 'RenderIQ_InsufficientCredits',
        :scrollable => false,
        :resizable => false,
        :width => 400,
        :height => 250
      }
      
      dlg = UI::WebDialog.new(options)
      
      html = <<-HTML
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
            .error { color: #e74c3c; font-size: 16px; font-weight: bold; margin: 20px 0; }
            .info { font-size: 14px; color: #666; margin: 10px 0; }
            button { padding: 10px 20px; margin: 5px; cursor: pointer; }
            .button-container { margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="error">⚠️ Insufficient Credits</div>
          <div class="info">
            <div>Required: <strong>#{required}</strong> credits</div>
            <div>Available: <strong>#{balance}</strong> credits</div>
            <div style="margin-top: 10px;">You need <strong>#{shortfall}</strong> more credits to continue.</div>
          </div>
          
          <div class="button-container">
            <button onclick="sketchup.callback('topup'); sketchup.close();">Top Up Credits</button>
            <button onclick="sketchup.close();">Cancel</button>
          </div>
        </body>
        </html>
      HTML
      
      dlg.set_html(html)
      
      dlg.add_action_callback('topup') {
        UI.openURL('https://renderiq.io/pricing')
      }
      
      dlg.show
    end
    
  end
end

