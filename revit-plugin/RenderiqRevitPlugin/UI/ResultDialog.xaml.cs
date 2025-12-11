using System;
using System.IO;
using System.Net.Http;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Media.Imaging;
using Microsoft.Win32;
using System.Diagnostics;

namespace RenderiqRevitPlugin.UI
{
    public partial class ResultDialog : Window
    {
        private readonly string _outputUrl;

        public ResultDialog(string outputUrl)
        {
            InitializeComponent();
            _outputUrl = outputUrl;
            
            Loaded += ResultDialog_Loaded;
        }

        private async void ResultDialog_Loaded(object sender, RoutedEventArgs e)
        {
            await LoadImage();
        }

        private async Task LoadImage()
        {
            try
            {
                using (HttpClient client = new HttpClient())
                {
                    var response = await client.GetAsync(_outputUrl);
                    response.EnsureSuccessStatusCode();

                    var imageBytes = await response.Content.ReadAsByteArrayAsync();

                    using (MemoryStream ms = new MemoryStream(imageBytes))
                    {
                        BitmapImage bitmap = new BitmapImage();
                        bitmap.BeginInit();
                        bitmap.StreamSource = ms;
                        bitmap.CacheOption = BitmapCacheOption.OnLoad;
                        bitmap.EndInit();
                        ResultImage.Source = bitmap;
                    }
                }
            }
            catch (Exception ex)
            {
                StatusTextBlock.Text = $"Failed to load image: {ex.Message}";
                StatusTextBlock.Foreground = System.Windows.Media.Brushes.Red;
            }
        }

        private void OpenBrowserButton_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                Process.Start(new ProcessStartInfo
                {
                    FileName = _outputUrl,
                    UseShellExecute = true
                });
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Failed to open browser: {ex.Message}", "Error", 
                    MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        private async void CopyLinkButton_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                Clipboard.SetText(_outputUrl);
                MessageBox.Show("Link copied to clipboard", "Success", 
                    MessageBoxButton.OK, MessageBoxImage.Information);
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Failed to copy link: {ex.Message}", "Error", 
                    MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        private async void SaveAsButton_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                SaveFileDialog dialog = new SaveFileDialog
                {
                    Filter = "PNG files (*.png)|*.png|JPEG files (*.jpg)|*.jpg|All files (*.*)|*.*",
                    FileName = $"Renderiq_Render_{DateTime.Now:yyyyMMdd_HHmmss}.png"
                };

                if (dialog.ShowDialog() == true)
                {
                    using (HttpClient client = new HttpClient())
                    {
                        var response = await client.GetAsync(_outputUrl);
                        response.EnsureSuccessStatusCode();

                        var imageBytes = await response.Content.ReadAsByteArrayAsync();
                        File.WriteAllBytes(dialog.FileName, imageBytes);

                        MessageBox.Show("Image saved successfully", "Success", 
                            MessageBoxButton.OK, MessageBoxImage.Information);
                    }
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Failed to save image: {ex.Message}", "Error", 
                    MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        private void CloseButton_Click(object sender, RoutedEventArgs e)
        {
            Close();
        }
    }
}

