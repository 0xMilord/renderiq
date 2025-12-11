using System;
using Autodesk.AutoCAD.ApplicationServices;
using Autodesk.AutoCAD.EditorInput;
using Autodesk.AutoCAD.Runtime;
using RenderiqAutoCADPlugin.UI;

namespace RenderiqAutoCADPlugin
{
    /// <summary>
    /// Command to open settings dialog
    /// Command: RENDERIQSETTINGS (alias: RIS)
    /// </summary>
    public class SettingsCommand
    {
        [CommandMethod("RENDERIQSETTINGS")]
        public void SettingsCommandMethod()
        {
            try
            {
                // Show settings dialog
                var settingsDialog = new SettingsDialog();
                settingsDialog.ShowDialog();
            }
            catch (Exception ex)
            {
                Application.DocumentManager.MdiActiveDocument?.Editor.WriteMessage(
                    $"\nRenderiq Error: {ex.Message}\n");
            }
        }
    }
}

