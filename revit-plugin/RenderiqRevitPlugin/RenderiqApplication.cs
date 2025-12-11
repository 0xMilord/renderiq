using System;
using System.IO;
using System.Reflection;
using Autodesk.Revit.UI;
using Autodesk.Revit.DB;
using Autodesk.Revit.Attributes;
using Autodesk.Revit.ApplicationServices;
using RenderiqRevitPlugin.UI;
using RenderiqRevitPlugin.Services;

namespace RenderiqRevitPlugin
{
    /// <summary>
    /// Main application class - handles plugin initialization and UI setup
    /// </summary>
    public class RenderiqApplication : IExternalApplication
    {
        private static RenderiqApplication _instance;
        public static RenderiqApplication Instance => _instance;

        private RibbonPanel _ribbonPanel;
        private StatusBarWidget _statusBarWidget;

        public Result OnStartup(UIControlledApplication application)
        {
            try
            {
                _instance = this;

                // Create ribbon panel
                CreateRibbonPanel(application);

                // Create status bar widget
                CreateStatusBarWidget(application);

                // Initialize settings
                SettingsManager.Initialize();

                // Check authentication status
                CheckAuthenticationStatus();

                return Result.Succeeded;
            }
            catch (Exception ex)
            {
                TaskDialog.Show("Renderiq Error", $"Failed to initialize Renderiq plugin: {ex.Message}");
                return Result.Failed;
            }
        }

        public Result OnShutdown(UIControlledApplication application)
        {
            try
            {
                // Cleanup
                _statusBarWidget?.Dispose();
                return Result.Succeeded;
            }
            catch
            {
                return Result.Failed;
            }
        }

        /// <summary>
        /// Create ribbon panel in Add-Ins tab
        /// </summary>
        private void CreateRibbonPanel(UIControlledApplication application)
        {
            // Get or create Add-Ins tab
            try
            {
                application.CreateRibbonTab("Add-Ins");
            }
            catch
            {
                // Tab already exists
            }

            // Create Renderiq panel
            _ribbonPanel = application.CreateRibbonPanel("Add-Ins", "Renderiq");

            // Get assembly path for icons
            string assemblyPath = Assembly.GetExecutingAssembly().Location;
            string assemblyDir = Path.GetDirectoryName(assemblyPath);
            string iconsPath = Path.Combine(assemblyDir, "Icons");

            // Render button (large)
            PushButtonData renderBtnData = new PushButtonData(
                "RenderiqRender",
                "Render",
                assemblyPath,
                "RenderiqRevitPlugin.RenderiqRenderCommand"
            );
            renderBtnData.LongDescription = "Render current view with Renderiq AI";
            renderBtnData.ToolTip = "Render current view with Renderiq AI\nQuality: High\nStyle: Photorealistic";
            renderBtnData.Image = LoadIcon(Path.Combine(iconsPath, "Renderiq32.png"));
            renderBtnData.LargeImage = LoadIcon(Path.Combine(iconsPath, "Renderiq32.png"));

            // Credits button (small)
            PushButtonData creditsBtnData = new PushButtonData(
                "RenderiqCredits",
                "Credits",
                assemblyPath,
                "RenderiqRevitPlugin.RenderiqCreditsCommand"
            );
            creditsBtnData.LongDescription = "View your Renderiq credit balance";
            creditsBtnData.ToolTip = "View credit balance and purchase credits";
            creditsBtnData.Image = LoadIcon(Path.Combine(iconsPath, "Credits16.png"));
            creditsBtnData.LargeImage = LoadIcon(Path.Combine(iconsPath, "Credits32.png"));

            // Settings button (small)
            PushButtonData settingsBtnData = new PushButtonData(
                "RenderiqSettings",
                "Settings",
                assemblyPath,
                "RenderiqRevitPlugin.RenderiqSettingsCommand"
            );
            settingsBtnData.LongDescription = "Configure Renderiq plugin settings";
            settingsBtnData.ToolTip = "Configure authentication and render settings";
            settingsBtnData.Image = LoadIcon(Path.Combine(iconsPath, "Settings16.png"));
            settingsBtnData.LargeImage = LoadIcon(Path.Combine(iconsPath, "Settings32.png"));

            // Projects button (small)
            PushButtonData projectsBtnData = new PushButtonData(
                "RenderiqProjects",
                "Projects",
                assemblyPath,
                "RenderiqRevitPlugin.RenderiqProjectsCommand"
            );
            projectsBtnData.LongDescription = "Manage Renderiq projects";
            projectsBtnData.ToolTip = "View and manage your Renderiq projects";
            projectsBtnData.Image = LoadIcon(Path.Combine(iconsPath, "Projects16.png"));
            projectsBtnData.LargeImage = LoadIcon(Path.Combine(iconsPath, "Projects32.png"));

            // Add buttons to panel
            _ribbonPanel.AddItem(renderBtnData);
            _ribbonPanel.AddStackedItems(creditsBtnData, settingsBtnData, projectsBtnData);

            // Add keyboard shortcut
            try
            {
                application.CreateShortcut(renderBtnData, "Ctrl+R");
            }
            catch
            {
                // Shortcut already exists or failed
            }
        }

        /// <summary>
        /// Create status bar widget
        /// </summary>
        private void CreateStatusBarWidget(UIControlledApplication application)
        {
            _statusBarWidget = new StatusBarWidget();
            // Status bar integration would go here
            // Note: Revit doesn't have a direct status bar API, so we'll use a different approach
        }

        /// <summary>
        /// Load icon from file
        /// </summary>
        private System.Windows.Media.Imaging.BitmapImage LoadIcon(string iconPath)
        {
            if (File.Exists(iconPath))
            {
                return new System.Windows.Media.Imaging.BitmapImage(new Uri(iconPath));
            }

            // Return default icon or create placeholder
            return CreatePlaceholderIcon();
        }

        /// <summary>
        /// Create placeholder icon if file not found
        /// </summary>
        private System.Windows.Media.Imaging.BitmapImage CreatePlaceholderIcon()
        {
            // Create a simple placeholder icon
            // In production, embed icons as resources
            return new System.Windows.Media.Imaging.BitmapImage();
        }

        /// <summary>
        /// Check authentication status and update UI
        /// </summary>
        private void CheckAuthenticationStatus()
        {
            try
            {
                var settings = SettingsManager.GetSettings();
                if (!string.IsNullOrEmpty(settings.AccessToken))
                {
                    // Verify token is still valid
                    Task.Run(async () =>
                    {
                        var apiClient = new RenderiqApiClient();
                        var isValid = await apiClient.ValidateToken(settings.AccessToken);
                        
                        if (!isValid)
                        {
                            // Token expired, clear it
                            SettingsManager.ClearAccessToken();
                        }
                    });
                }
            }
            catch
            {
                // Ignore errors during startup
            }
        }

        /// <summary>
        /// Update status bar with credits
        /// </summary>
        public void UpdateStatusBar(int credits)
        {
            _statusBarWidget?.UpdateCredits(credits);
        }
    }
}

