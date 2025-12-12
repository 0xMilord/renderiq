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
      
      dlg = UIHelper.create_dialog(
        dialog_title: 'Renderiq Credits',
        preferences_key: 'RenderIQ_Credits',
        width: 500,
        height: 450
      )
      
      balance = credits_info[:success] ? credits_info[:balance] : 0
      is_low = balance < 5
      
      html = <<-HTML
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            #{UIHelper.modern_css}
            body { text-align: center; }
            .balance {
              font-size: 64px;
              font-weight: 700;
              color: #{is_low ? '#e74c3c' : '#27ae60'};
              margin: 20px 0;
              line-height: 1;
            }
            .label {
              font-size: 14px;
              color: #666;
              margin-bottom: 10px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .warning {
              color: #e74c3c;
              font-size: 14px;
              margin: 16px 0;
              padding: 12px;
              background: #ffeaea;
              border-radius: 8px;
            }
            .stats {
              margin-top: 24px;
              font-size: 13px;
              color: #666;
              padding-top: 20px;
              border-top: 1px solid #eee;
            }
            .stats div {
              margin: 8px 0;
            }
            .button-group {
              display: flex;
              gap: 12px;
              margin-top: 24px;
            }
            .button-group button {
              flex: 1;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <h2>💎 Your Credits</h2>
              <div class="label">Available Balance</div>
              <div class="balance">#{balance}</div>
              #{is_low ? '<div class="warning">⚠️ Low credits! Consider topping up.</div>' : ''}
              
              <div class="stats">
                <div><strong>Total Earned:</strong> #{credits_info[:total_earned] || 0}</div>
                <div><strong>Total Spent:</strong> #{credits_info[:total_spent] || 0}</div>
              </div>
              
              <div class="button-group">
                <button class="btn-primary" onclick="sketchup.callback('topup'); sketchup.close();">
                  💰 Top Up
                </button>
                <button class="btn-secondary" onclick="sketchup.callback('refresh'); location.reload();">
                  🔄 Refresh
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
      
      dlg = UIHelper.create_dialog(
        dialog_title: 'Insufficient Credits',
        preferences_key: 'RenderIQ_InsufficientCredits',
        width: 450,
        height: 350,
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
            .error-box {
              color: #e74c3c;
              font-size: 20px;
              font-weight: 700;
              margin: 24px 0;
              padding: 20px;
              background: #ffeaea;
              border-radius: 12px;
            }
            .info {
              font-size: 15px;
              color: #333;
              margin: 16px 0;
              line-height: 1.8;
            }
            .info strong {
              color: #1a1a1a;
              font-size: 18px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="error-box">⚠️ Insufficient Credits</div>
              <div class="info">
                <div>Required: <strong>#{required}</strong> credits</div>
                <div>Available: <strong>#{balance}</strong> credits</div>
                <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #eee;">
                  You need <strong>#{shortfall}</strong> more credits to continue.
                </div>
              </div>
              
              <button class="btn-primary" onclick="sketchup.callback('topup'); sketchup.close();" style="margin-top: 24px;">
                💰 Top Up Credits
              </button>
              <button class="btn-secondary" onclick="sketchup.close();" style="margin-top: 12px;">
                Cancel
              </button>
            </div>
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

