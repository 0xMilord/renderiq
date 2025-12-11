using System;
using System.Windows;
using RenderiqRevitPlugin.Services;

namespace RenderiqRevitPlugin.UI
{
    public partial class SettingsDialog : Window
    {
        private PluginSettings _settings;

        public SettingsDialog()
        {
            InitializeComponent();
            LoadSettings();
        }

        private void LoadSettings()
        {
            _settings = SettingsManager.GetSettings();

            // Update UI
            UpdateAuthStatus();
            
            DefaultQualityComboBox.SelectedIndex = _settings.DefaultQuality switch
            {
                "standard" => 0,
                "high" => 1,
                "ultra" => 2,
                _ => 1
            };

            DefaultStyleComboBox.SelectedIndex = _settings.DefaultStyle switch
            {
                "photorealistic" => 0,
                "dramatic" => 1,
                "soft" => 2,
                "studio" => 3,
                "natural" => 4,
                _ => 0
            };

            DefaultAspectComboBox.SelectedIndex = _settings.DefaultAspectRatio switch
            {
                "16:9" => 0,
                "4:3" => 1,
                "1:1" => 2,
                "9:16" => 3,
                _ => 0
            };

            ExportResolutionComboBox.SelectedIndex = _settings.ExportResolution switch
            {
                1920 => 0,
                4096 => 1,
                8192 => 2,
                _ => 1
            };
        }

        private void UpdateAuthStatus()
        {
            string token = SettingsManager.GetAccessToken();
            if (!string.IsNullOrEmpty(token))
            {
                AuthStatusTextBlock.Text = "Status: ✅ Signed in";
            }
            else
            {
                AuthStatusTextBlock.Text = "Status: Not signed in";
            }
        }

        private void SignInButton_Click(object sender, RoutedEventArgs e)
        {
            var loginDialog = new LoginDialog();
            if (loginDialog.ShowDialog() == true)
            {
                UpdateAuthStatus();
            }
        }

        private void SignOutButton_Click(object sender, RoutedEventArgs e)
        {
            if (MessageBox.Show("Are you sure you want to sign out?", "Sign Out", 
                MessageBoxButton.YesNo, MessageBoxImage.Question) == MessageBoxResult.Yes)
            {
                SettingsManager.ClearAccessToken();
                UpdateAuthStatus();
            }
        }

        private void SaveApiKeyButton_Click(object sender, RoutedEventArgs e)
        {
            // Save API key (implementation)
            MessageBox.Show("API key saved", "Settings", MessageBoxButton.OK, MessageBoxImage.Information);
        }

        private void TestWebhookButton_Click(object sender, RoutedEventArgs e)
        {
            // Test webhook (implementation)
            MessageBox.Show("Webhook test not implemented yet", "Settings", 
                MessageBoxButton.OK, MessageBoxImage.Information);
        }

        private void SaveButton_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                // Update settings
                _settings.DefaultQuality = DefaultQualityComboBox.SelectedIndex switch
                {
                    0 => "standard",
                    1 => "high",
                    2 => "ultra",
                    _ => "high"
                };

                _settings.DefaultStyle = DefaultStyleComboBox.SelectedItem?.ToString()?.ToLower() ?? "photorealistic";
                _settings.DefaultAspectRatio = DefaultAspectComboBox.SelectedItem?.ToString() ?? "16:9";
                _settings.ExportResolution = ExportResolutionComboBox.SelectedIndex switch
                {
                    0 => 1920,
                    1 => 4096,
                    2 => 8192,
                    _ => 4096
                };

                SettingsManager.SaveSettings(_settings);

                MessageBox.Show("Settings saved successfully", "Settings", 
                    MessageBoxButton.OK, MessageBoxImage.Information);
                
                DialogResult = true;
                Close();
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Failed to save settings: {ex.Message}", "Error", 
                    MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        private void CancelButton_Click(object sender, RoutedEventArgs e)
        {
            DialogResult = false;
            Close();
        }
    }
}

