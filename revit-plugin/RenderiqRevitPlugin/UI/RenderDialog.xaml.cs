using System;
using System.IO;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Media.Imaging;
using Autodesk.Revit.UI;
using RenderiqRevitPlugin.Services;
using RenderiqRevitPlugin.Models;

namespace RenderiqRevitPlugin.UI
{
    public partial class RenderDialog : Window
    {
        private readonly UIDocument _uiDoc;
        private readonly string _accessToken;
        private RenderiqApiClient _apiClient;
        private string _currentRenderId;
        private bool _isRendering = false;

        public RenderDialog(UIDocument uiDoc, string accessToken)
        {
            InitializeComponent();
            _uiDoc = uiDoc;
            _accessToken = accessToken;
            _apiClient = new RenderiqApiClient(accessToken);

            // Load preview
            LoadPreview();

            // Update credits display
            UpdateCreditsDisplay();

            // Wire up quality change handler
            QualityComboBox.SelectionChanged += QualityComboBox_SelectionChanged;
        }

        private void LoadPreview()
        {
            try
            {
                // Capture small preview
                byte[] previewData = ViewExporter.ExportViewToImage(_uiDoc, 512);
                
                using (MemoryStream ms = new MemoryStream(previewData))
                {
                    BitmapImage bitmap = new BitmapImage();
                    bitmap.BeginInit();
                    bitmap.StreamSource = ms;
                    bitmap.CacheOption = BitmapCacheOption.OnLoad;
                    bitmap.EndInit();
                    PreviewImage.Source = bitmap;
                }
            }
            catch
            {
                // Preview failed, continue anyway
            }
        }

        private async void UpdateCreditsDisplay()
        {
            try
            {
                var credits = await _apiClient.GetCreditsAsync();
                // Update UI with credits (if we had a credits display)
            }
            catch
            {
                // Ignore errors
            }
        }

        private void QualityComboBox_SelectionChanged(object sender, System.Windows.Controls.SelectionChangedEventArgs e)
        {
            // Update credits cost based on quality
            int credits = QualityComboBox.SelectedIndex switch
            {
                0 => 5,  // Standard
                1 => 10, // High
                2 => 15, // Ultra
                _ => 10
            };
            CreditsTextBlock.Text = credits.ToString();
        }

        private async void RenderButton_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                if (_isRendering)
                {
                    return;
                }

                _isRendering = true;
                ProgressOverlay.Visibility = Visibility.Visible;
                ProgressText.Text = "Exporting view...";

                // Get settings
                var settings = new RenderSettings
                {
                    Quality = QualityComboBox.SelectedIndex switch
                    {
                        0 => "standard",
                        1 => "high",
                        2 => "ultra",
                        _ => "high"
                    },
                    Style = StyleComboBox.SelectedItem?.ToString()?.ToLower() ?? "photorealistic",
                    AspectRatio = AspectRatioComboBox.SelectedItem?.ToString() ?? "16:9"
                };

                // Export view
                ProgressText.Text = "Exporting view to image...";
                byte[] imageData = ViewExporter.ExportViewWithSettings(_uiDoc, settings);

                // Create render
                ProgressText.Text = "Uploading to Renderiq...";
                var renderResponse = await _apiClient.CreateRenderAsync(
                    imageData,
                    "image/png",
                    settings
                );

                _currentRenderId = renderResponse.RenderId ?? renderResponse.Id;

                // Poll for completion
                ProgressText.Text = "Rendering...";
                await PollRenderStatus();

                // Show result
                DialogResult = true;
                Close();
            }
            catch (RenderiqApiException ex)
            {
                MessageBox.Show($"Render failed: {ex.Message}", "Renderiq Error", MessageBoxButton.OK, MessageBoxImage.Error);
                ProgressOverlay.Visibility = Visibility.Collapsed;
                _isRendering = false;
            }
            catch (Exception ex)
            {
                MessageBox.Show($"An error occurred: {ex.Message}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
                ProgressOverlay.Visibility = Visibility.Collapsed;
                _isRendering = false;
            }
        }

        private async Task PollRenderStatus()
        {
            int maxAttempts = 60; // 5 minutes max
            int attempt = 0;

            while (attempt < maxAttempts)
            {
                await Task.Delay(5000); // Poll every 5 seconds

                try
                {
                    var status = await _apiClient.GetRenderStatusAsync(_currentRenderId);

                    if (status.Status == "completed")
                    {
                        ProgressText.Text = "Render complete!";
                        // Show result dialog
                        ShowResultDialog(status.OutputUrl);
                        return;
                    }
                    else if (status.Status == "failed")
                    {
                        throw new Exception(status.Error ?? "Render failed");
                    }
                    else
                    {
                        // Update progress
                        if (status.Progress.HasValue)
                        {
                            ProgressBar.IsIndeterminate = false;
                            ProgressBar.Value = status.Progress.Value;
                            ProgressText.Text = $"Rendering... {status.Progress.Value}%";
                        }
                        else
                        {
                            ProgressText.Text = "Rendering...";
                        }
                    }
                }
                catch (Exception ex)
                {
                    throw new Exception($"Failed to check render status: {ex.Message}", ex);
                }

                attempt++;
            }

            throw new Exception("Render timeout - please check status manually");
        }

        private void ShowResultDialog(string outputUrl)
        {
            var resultDialog = new ResultDialog(outputUrl);
            resultDialog.ShowDialog();
        }

        private void CancelButton_Click(object sender, RoutedEventArgs e)
        {
            DialogResult = false;
            Close();
        }

        private void CancelRenderButton_Click(object sender, RoutedEventArgs e)
        {
            // Cancel render (if possible)
            _isRendering = false;
            ProgressOverlay.Visibility = Visibility.Collapsed;
        }
    }
}

