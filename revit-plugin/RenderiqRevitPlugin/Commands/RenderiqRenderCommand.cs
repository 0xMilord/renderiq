using System;
using System.Threading.Tasks;
using Autodesk.Revit.Attributes;
using Autodesk.Revit.DB;
using Autodesk.Revit.UI;
using RenderiqRevitPlugin.Services;
using RenderiqRevitPlugin.UI;
using RenderiqRevitPlugin.Models;

namespace RenderiqRevitPlugin
{
    /// <summary>
    /// Main render command - renders current view with Renderiq AI
    /// </summary>
    [Transaction(TransactionMode.Manual)]
    [Regeneration(RegenerationOption.Manual)]
    public class RenderiqRenderCommand : IExternalCommand
    {
        public Result Execute(ExternalCommandData commandData, ref string message, ElementSet elements)
        {
            try
            {
                UIApplication uiApp = commandData.Application;
                UIDocument uiDoc = uiApp.ActiveUIDocument;

                if (uiDoc == null)
                {
                    TaskDialog.Show("Renderiq", "No active document. Please open a Revit project.");
                    return Result.Failed;
                }

                View activeView = uiDoc.ActiveView;
                if (activeView == null)
                {
                    TaskDialog.Show("Renderiq", "No active view. Please select a view to render.");
                    return Result.Failed;
                }

                // Check authentication
                var settings = SettingsManager.GetSettings();
                string accessToken = SettingsManager.GetAccessToken();

                if (string.IsNullOrEmpty(accessToken))
                {
                    // Show login dialog
                    var loginDialog = new LoginDialog();
                    if (loginDialog.ShowDialog() == true)
                    {
                        accessToken = SettingsManager.GetAccessToken();
                    }
                    else
                    {
                        return Result.Cancelled;
                    }
                }

                if (string.IsNullOrEmpty(accessToken))
                {
                    TaskDialog.Show("Renderiq", "Authentication required. Please sign in.");
                    return Result.Failed;
                }

                // Show render dialog
                var renderDialog = new RenderDialog(uiDoc, accessToken);
                if (renderDialog.ShowDialog() == true)
                {
                    // Render was successful
                    TaskDialog.Show("Renderiq", "Render completed successfully!");
                    return Result.Succeeded;
                }
                else
                {
                    return Result.Cancelled;
                }
            }
            catch (Exception ex)
            {
                message = ex.Message;
                TaskDialog.Show("Renderiq Error", $"An error occurred: {ex.Message}\n\n{ex.StackTrace}");
                return Result.Failed;
            }
        }
    }
}

