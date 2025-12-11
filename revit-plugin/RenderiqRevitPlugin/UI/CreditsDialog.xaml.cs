using System;
using System.Threading.Tasks;
using System.Windows;
using System.Diagnostics;
using RenderiqRevitPlugin.Services;
using RenderiqRevitPlugin.Models;

namespace RenderiqRevitPlugin.UI
{
    public partial class CreditsDialog : Window
    {
        private readonly string _accessToken;
        private RenderiqApiClient _apiClient;

        public CreditsDialog(string accessToken)
        {
            InitializeComponent();
            _accessToken = accessToken;
            _apiClient = new RenderiqApiClient(accessToken);

            Loaded += CreditsDialog_Loaded;
        }

        private async void CreditsDialog_Loaded(object sender, RoutedEventArgs e)
        {
            await LoadCredits();
        }

        private async Task LoadCredits()
        {
            try
            {
                LoadingOverlay.Visibility = Visibility.Visible;

                var credits = await _apiClient.GetCreditsAsync();

                BalanceTextBlock.Text = credits.Balance.ToString();
                TotalEarnedTextBlock.Text = credits.TotalEarned.ToString();
                TotalSpentTextBlock.Text = credits.TotalSpent.ToString();

                // Show warning if low credits
                if (credits.Balance < 20)
                {
                    LowCreditsWarning.Visibility = Visibility.Visible;
                    BalanceTextBlock.Foreground = new System.Windows.Media.SolidColorBrush(
                        System.Windows.Media.Color.FromRgb(231, 76, 60)); // Red
                }
                else
                {
                    LowCreditsWarning.Visibility = Visibility.Collapsed;
                    BalanceTextBlock.Foreground = new System.Windows.Media.SolidColorBrush(
                        System.Windows.Media.Color.FromRgb(39, 174, 96)); // Green
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Failed to load credits: {ex.Message}", "Error", 
                    MessageBoxButton.OK, MessageBoxImage.Error);
            }
            finally
            {
                LoadingOverlay.Visibility = Visibility.Collapsed;
            }
        }

        private void TopUpButton_Click(object sender, RoutedEventArgs e)
        {
            Process.Start(new ProcessStartInfo
            {
                FileName = "https://renderiq.io/pricing",
                UseShellExecute = true
            });
        }

        private async void RefreshButton_Click(object sender, RoutedEventArgs e)
        {
            await LoadCredits();
        }

        private void CloseButton_Click(object sender, RoutedEventArgs e)
        {
            Close();
        }
    }
}

