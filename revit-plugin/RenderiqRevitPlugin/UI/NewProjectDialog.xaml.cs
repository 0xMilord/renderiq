using System;
using System.Threading.Tasks;
using System.Windows;
using RenderiqRevitPlugin.Services;
using RenderiqRevitPlugin.Models;

namespace RenderiqRevitPlugin.UI
{
    public partial class NewProjectDialog : Window
    {
        private readonly string _accessToken;
        private RenderiqApiClient _apiClient;

        public ProjectInfo CreatedProject { get; private set; }

        public NewProjectDialog(string accessToken)
        {
            InitializeComponent();
            _accessToken = accessToken;
            _apiClient = new RenderiqApiClient(accessToken);
        }

        private async void CreateButton_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                string name = ProjectNameTextBox.Text.Trim();
                string description = DescriptionTextBox.Text.Trim();

                if (string.IsNullOrEmpty(name))
                {
                    ShowError("Project name is required");
                    return;
                }

                LoadingOverlay.Visibility = Visibility.Visible;
                ErrorTextBlock.Visibility = Visibility.Collapsed;

                var project = await _apiClient.CreateProjectAsync(name, description);
                CreatedProject = project;

                DialogResult = true;
                Close();
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
                LoadingOverlay.Visibility = Visibility.Collapsed;
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
    }
}

