using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using RenderiqRevitPlugin.Services;
using RenderiqRevitPlugin.Models;
using Newtonsoft.Json;

namespace RenderiqRevitPlugin.UI
{
    public partial class ProjectsDialog : Window
    {
        private readonly string _accessToken;
        private RenderiqApiClient _apiClient;
        private List<ProjectInfo> _projects;

        public ProjectInfo SelectedProject { get; private set; }

        public ProjectsDialog(string accessToken)
        {
            InitializeComponent();
            _accessToken = accessToken;
            _apiClient = new RenderiqApiClient(accessToken);

            Loaded += ProjectsDialog_Loaded;
        }

        private async void ProjectsDialog_Loaded(object sender, RoutedEventArgs e)
        {
            await LoadProjects();
        }

        private async Task LoadProjects()
        {
            try
            {
                LoadingOverlay.Visibility = Visibility.Visible;

                // Get projects from API
                var response = await _apiClient.GetProjectsAsync();
                _projects = response?.ToList() ?? new List<ProjectInfo>();

                ProjectsListBox.ItemsSource = _projects;
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Failed to load projects: {ex.Message}", "Error", 
                    MessageBoxButton.OK, MessageBoxImage.Error);
            }
            finally
            {
                LoadingOverlay.Visibility = Visibility.Collapsed;
            }
        }

        private void ProjectsListBox_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            SelectedProject = ProjectsListBox.SelectedItem as ProjectInfo;
        }

        private void SelectProjectButton_Click(object sender, RoutedEventArgs e)
        {
            var button = sender as Button;
            var project = button?.Tag as ProjectInfo;
            
            if (project != null)
            {
                SelectedProject = project;
                
                // Save as default project
                var settings = SettingsManager.GetSettings();
                settings.DefaultProjectId = project.Id;
                SettingsManager.SaveSettings(settings);

                MessageBox.Show($"Selected project: {project.Name}", "Project Selected", 
                    MessageBoxButton.OK, MessageBoxImage.Information);
            }
        }

        private void NewProjectButton_Click(object sender, RoutedEventArgs e)
        {
            var newProjectDialog = new NewProjectDialog(_accessToken);
            if (newProjectDialog.ShowDialog() == true)
            {
                // Refresh projects list
                LoadProjects();
            }
        }

        private async void RefreshButton_Click(object sender, RoutedEventArgs e)
        {
            await LoadProjects();
        }

        private void CloseButton_Click(object sender, RoutedEventArgs e)
        {
            Close();
        }
    }
}

