using System;
using System.IO;
using System.Reflection;
using System.Threading.Tasks;
using Autodesk.AutoCAD.ApplicationServices;
using Autodesk.AutoCAD.Runtime;
using Autodesk.AutoCAD.Geometry;
using Autodesk.AutoCAD.GraphicsInterface;
using Autodesk.Windows;
using RenderiqAutoCADPlugin.Services;
using RenderiqAutoCADPlugin.UI;

namespace RenderiqAutoCADPlugin
{
    /// <summary>
    /// Main application class - handles plugin initialization and UI setup
    /// </summary>
    public class RenderiqApplication : IExtensionApplication
    {
        private static RenderiqApplication _instance;
        public static RenderiqApplication Instance => _instance;

        private RibbonPanel _ribbonPanel;

        public void Initialize()
        {
            try
            {
                _instance = this;

                // Create ribbon panel
                CreateRibbonPanel();

                // Initialize settings
                SettingsManager.Initialize();

                // Check authentication status
                CheckAuthenticationStatus();

                // Register command aliases
                RegisterCommandAliases();
            }
            catch (Exception ex)
            {
                Application.DocumentManager.MdiActiveDocument?.Editor.WriteMessage(
                    $"\nRenderiq Error: Failed to initialize: {ex.Message}\n");
            }
        }

        public void Terminate()
        {
            try
            {
                // Cleanup
                _ribbonPanel = null;
            }
            catch
            {
                // Ignore cleanup errors
            }
        }

        /// <summary>
        /// Create ribbon panel in Add-Ins tab
        /// </summary>
        private void CreateRibbonPanel()
        {
            try
            {
                RibbonControl ribbon = ComponentManager.Ribbon;
                if (ribbon == null) return;

                // Find or create Add-Ins tab
                RibbonTab addInsTab = ribbon.FindTab("ACAD.AddIns");
                if (addInsTab == null)
                {
                    addInsTab = new RibbonTab();
                    addInsTab.Title = "Add-Ins";
                    addInsTab.Id = "ACAD.AddIns";
                    ribbon.Tabs.Add(addInsTab);
                }

                // Create Renderiq panel
                RibbonPanelSource panelSource = new RibbonPanelSource();
                panelSource.Title = "Renderiq";
                panelSource.Id = "RenderiqPanel";

                // Get assembly path for icons
                string assemblyPath = Assembly.GetExecutingAssembly().Location;
                string assemblyDir = Path.GetDirectoryName(assemblyPath);
                string iconsPath = Path.Combine(assemblyDir, "Icons");

                // Render button (large)
                RibbonButton renderBtn = new RibbonButton();
                renderBtn.Text = "Render";
                renderBtn.Description = "Render current view with Renderiq AI";
                renderBtn.ShowText = true;
                renderBtn.Size = RibbonItemSize.Large;
                renderBtn.Image = LoadIcon(Path.Combine(iconsPath, "Renderiq32.bmp"));
                renderBtn.LargeImage = LoadIcon(Path.Combine(iconsPath, "Renderiq32.bmp"));
                renderBtn.CommandHandler = new RenderiqCommandHandler("RENDERIQ");
                renderBtn.CommandParameter = "RENDERIQ";

                // Credits button (large)
                RibbonButton creditsBtn = new RibbonButton();
                creditsBtn.Text = "Credits";
                creditsBtn.Description = "View your Renderiq credit balance";
                creditsBtn.ShowText = true;
                creditsBtn.Size = RibbonItemSize.Large;
                creditsBtn.Image = LoadIcon(Path.Combine(iconsPath, "Credits32.bmp"));
                creditsBtn.LargeImage = LoadIcon(Path.Combine(iconsPath, "Credits32.bmp"));
                creditsBtn.CommandHandler = new RenderiqCommandHandler("RENDERIQCREDITS");
                creditsBtn.CommandParameter = "RENDERIQCREDITS";

                // Settings button (small)
                RibbonButton settingsBtn = new RibbonButton();
                settingsBtn.Text = "Settings";
                settingsBtn.Description = "Configure Renderiq plugin settings";
                settingsBtn.ShowText = true;
                settingsBtn.Size = RibbonItemSize.Standard;
                settingsBtn.Image = LoadIcon(Path.Combine(iconsPath, "Settings16.bmp"));
                settingsBtn.LargeImage = LoadIcon(Path.Combine(iconsPath, "Settings32.bmp"));
                settingsBtn.CommandHandler = new RenderiqCommandHandler("RENDERIQSETTINGS");
                settingsBtn.CommandParameter = "RENDERIQSETTINGS";

                // Projects button (small)
                RibbonButton projectsBtn = new RibbonButton();
                projectsBtn.Text = "Projects";
                projectsBtn.Description = "Manage Renderiq projects";
                projectsBtn.ShowText = true;
                projectsBtn.Size = RibbonItemSize.Standard;
                projectsBtn.Image = LoadIcon(Path.Combine(iconsPath, "Projects16.bmp"));
                projectsBtn.LargeImage = LoadIcon(Path.Combine(iconsPath, "Projects32.bmp"));
                projectsBtn.CommandHandler = new RenderiqCommandHandler("RENDERIQPROJECTS");
                projectsBtn.CommandParameter = "RENDERIQPROJECTS";

                // Queue button (small)
                RibbonButton queueBtn = new RibbonButton();
                queueBtn.Text = "Queue";
                queueBtn.Description = "View render queue";
                queueBtn.ShowText = true;
                queueBtn.Size = RibbonItemSize.Standard;
                queueBtn.Image = LoadIcon(Path.Combine(iconsPath, "Queue16.bmp"));
                queueBtn.LargeImage = LoadIcon(Path.Combine(iconsPath, "Queue32.bmp"));
                queueBtn.CommandHandler = new RenderiqCommandHandler("RENDERIQQUEUE");
                queueBtn.CommandParameter = "RENDERIQQUEUE";

                // Add buttons to panel
                panelSource.Items.Add(renderBtn);
                panelSource.Items.Add(creditsBtn);
                panelSource.Items.Add(settingsBtn);
                panelSource.Items.Add(projectsBtn);
                panelSource.Items.Add(queueBtn);

                RibbonPanel panel = new RibbonPanel();
                panel.Source = panelSource;
                addInsTab.Panels.Add(panel);

                _ribbonPanel = panel;
            }
            catch (Exception ex)
            {
                Application.DocumentManager.MdiActiveDocument?.Editor.WriteMessage(
                    $"\nRenderiq Error: Failed to create ribbon panel: {ex.Message}\n");
            }
        }

        /// <summary>
        /// Load icon from file
        /// </summary>
        private System.Windows.Media.ImageSource LoadIcon(string iconPath)
        {
            if (File.Exists(iconPath))
            {
                try
                {
                    return new System.Windows.Media.Imaging.BitmapImage(new Uri(iconPath));
                }
                catch
                {
                    // Fall through to placeholder
                }
            }

            // Return placeholder or null
            return null;
        }

        /// <summary>
        /// Register command aliases
        /// </summary>
        private void RegisterCommandAliases()
        {
            try
            {
                // Register aliases via command line
                // RIR = RENDERIQ
                // RIS = RENDERIQSETTINGS
                // RIC = RENDERIQCREDITS
                // RIQ = RENDERIQQUEUE

                // Note: Aliases should be registered in acad.pgp or via command
                // For now, we'll rely on users creating aliases manually
            }
            catch
            {
                // Ignore alias registration errors
            }
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
                    // Verify token is still valid (async, non-blocking)
                    Task.Run(async () =>
                    {
                        try
                        {
                            var apiClient = new RenderiqApiClient();
                            var isValid = await apiClient.ValidateToken(settings.AccessToken);
                            
                            if (!isValid)
                            {
                                // Token expired, clear it
                                SettingsManager.ClearAccessToken();
                            }
                        }
                        catch
                        {
                            // Ignore validation errors during startup
                        }
                    });
                }
            }
            catch
            {
                // Ignore errors during startup
            }
        }
    }

    /// <summary>
    /// Command handler for ribbon buttons
    /// </summary>
    public class RenderiqCommandHandler : System.Windows.Input.ICommand
    {
        private string _commandName;

        public RenderiqCommandHandler(string commandName)
        {
            _commandName = commandName;
        }

        public event EventHandler CanExecuteChanged;

        public bool CanExecute(object parameter)
        {
            return true;
        }

        public void Execute(object parameter)
        {
            try
            {
                Application.DocumentManager.MdiActiveDocument?.SendStringToExecute(
                    $"{_commandName} ", true, false, false);
            }
            catch (Exception ex)
            {
                Application.DocumentManager.MdiActiveDocument?.Editor.WriteMessage(
                    $"\nRenderiq Error: {ex.Message}\n");
            }
        }
    }
}

