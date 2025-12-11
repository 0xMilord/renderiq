using System;
using Autodesk.Revit.Attributes;
using Autodesk.Revit.DB;
using Autodesk.Revit.UI;
using RenderiqRevitPlugin.Services;
using RenderiqRevitPlugin.UI;

namespace RenderiqRevitPlugin
{
    /// <summary>
    /// Command to open settings dialog
    /// </summary>
    [Transaction(TransactionMode.Manual)]
    [Regeneration(RegenerationOption.Manual)]
    public class RenderiqSettingsCommand : IExternalCommand
    {
        public Result Execute(ExternalCommandData commandData, ref string message, ElementSet elements)
        {
            try
            {
                // Show settings dialog
                var settingsDialog = new SettingsDialog();
                settingsDialog.ShowDialog();

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

