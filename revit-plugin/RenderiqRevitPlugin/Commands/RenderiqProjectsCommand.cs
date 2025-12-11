using System;
using Autodesk.Revit.Attributes;
using Autodesk.Revit.DB;
using Autodesk.Revit.UI;
using RenderiqRevitPlugin.Services;
using RenderiqRevitPlugin.UI;

namespace RenderiqRevitPlugin
{
    /// <summary>
    /// Command to manage projects
    /// </summary>
    [Transaction(TransactionMode.Manual)]
    [Regeneration(RegenerationOption.Manual)]
    public class RenderiqProjectsCommand : IExternalCommand
    {
        public Result Execute(ExternalCommandData commandData, ref string message, ElementSet elements)
        {
            try
            {
                string accessToken = SettingsManager.GetAccessToken();

                if (string.IsNullOrEmpty(accessToken))
                {
                    TaskDialog.Show("Renderiq", "Please sign in to view your projects.");
                    return Result.Failed;
                }

                // Show projects dialog
                var projectsDialog = new ProjectsDialog(accessToken);
                projectsDialog.ShowDialog();

                return Result.Succeeded;
            }
            catch (Exception ex)
            {
                message = ex.Message;
                TaskDialog.Show("Renderiq Error", $"An error occurred: {ex.Message}");
                return Result.Failed;
            }
        }
    }
}

