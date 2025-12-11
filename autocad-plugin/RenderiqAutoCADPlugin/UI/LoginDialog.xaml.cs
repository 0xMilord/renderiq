using System;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Navigation;
using System.Diagnostics;
using RenderiqAutoCADPlugin.Services;
using RenderiqAutoCADPlugin.Models;

namespace RenderiqAutoCADPlugin.UI
{
    public partial class LoginDialog : Window
    {
        public LoginDialog()
        {
            InitializeComponent();
            
            // Load saved email if exists
            var settings = SettingsManager.GetSettings();
            if (!string.IsNullOrEmpty(settings.AccessToken))
            {
                // Try to get user info to populate email
                // For now, leave empty
            }
        }

        private async void SignInButton_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                string email = EmailTextBox.Text.Trim();
                string password = PasswordBox.Password;

                if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(password))
                {
                    ShowError("Please enter email and password");
                    return;
                }

                ProgressOverlay.Visibility = Visibility.Visible;
                ErrorTextBlock.Visibility = Visibility.Collapsed;

                // Sign in
                var apiClient = new RenderiqApiClient();
                var response = await apiClient.SignInAsync(email, password);

                if (response.Success && !string.IsNullOrEmpty(response.AccessToken))
                {
                    // Save tokens
                    SettingsManager.SaveAccessToken(response.AccessToken);
                    
                    var settings = SettingsManager.GetSettings();
                    if (RememberMeCheckBox.IsChecked == true)
                    {
                        settings.RefreshToken = response.RefreshToken;
                    }
                    SettingsManager.SaveSettings(settings);

                    DialogResult = true;
                    Close();
                }
                else
                {
                    ShowError("Sign in failed. Please check your credentials.");
                }
            }
            catch (RenderiqApiException ex)
            {
                ShowError(ex.Message);
            }
            catch (Exception ex)
            {
                ShowError($"An error occurred: {ex.Message}");
            }
            finally
            {
                ProgressOverlay.Visibility = Visibility.Collapsed;
            }
        }

        private void ShowError(string message)
        {
            ErrorTextBlock.Text = message;
            ErrorTextBlock.Visibility = Visibility.Visible;
        }

        private void CancelButton_Click(object sender, RoutedEventArgs e)
        {
            DialogResult = false;
            Close();
        }

        private void SignUpLink_RequestNavigate(object sender, RequestNavigateEventArgs e)
        {
            Process.Start(new ProcessStartInfo
            {
                FileName = e.Uri.AbsoluteUri,
                UseShellExecute = true
            });
            e.Handled = true;
        }
    }
}

