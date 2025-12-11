using System;
using Autodesk.AutoCAD.ApplicationServices;
using Autodesk.AutoCAD.EditorInput;
using Autodesk.AutoCAD.Runtime;
using RenderiqAutoCADPlugin.Services;
using RenderiqAutoCADPlugin.UI;

namespace RenderiqAutoCADPlugin
{
    /// <summary>
    /// Command to view credit balance
    /// Command: RENDERIQCREDITS (alias: RIC)
    /// </summary>
    public class CreditsCommand
    {
        [CommandMethod("RENDERIQCREDITS")]
        public void CreditsCommandMethod()
        {
            try
            {
                string accessToken = SettingsManager.GetAccessToken();

                if (string.IsNullOrEmpty(accessToken))
                {
                    Application.DocumentManager.MdiActiveDocument.Editor.WriteMessage(
                        "\nRenderiq: Please sign in to view your credits. Use RENDERIQSETTINGS command.\n");
                    return;
                }

                // Show credits dialog
                var creditsDialog = new CreditsDialog(accessToken);
                creditsDialog.ShowDialog();
            }
            catch (Exception ex)
            {
                Application.DocumentManager.MdiActiveDocument?.Editor.WriteMessage(
                    $"\nRenderiq Error: {ex.Message}\n");
            }
        }
    }
}

