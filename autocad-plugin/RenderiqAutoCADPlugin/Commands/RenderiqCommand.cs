using System;
using System.Threading.Tasks;
using Autodesk.AutoCAD.ApplicationServices;
using Autodesk.AutoCAD.EditorInput;
using Autodesk.AutoCAD.Runtime;
using RenderiqAutoCADPlugin.Services;
using RenderiqAutoCADPlugin.UI;
using RenderiqAutoCADPlugin.Models;

namespace RenderiqAutoCADPlugin
{
    /// <summary>
    /// Main render command - renders current view with Renderiq AI
    /// Command: RENDERIQ (alias: RIR)
    /// </summary>
    public class RenderiqCommand
    {
        [CommandMethod("RENDERIQ")]
        public void RenderCommand()
        {
            try
            {
                Document doc = Application.DocumentManager.MdiActiveDocument;
                
                if (doc == null)
                {
                    Application.DocumentManager.MdiActiveDocument.Editor.WriteMessage(
                        "\nRenderiq: No active document. Please open a drawing.\n");
                    return;
                }

                // Check authentication
                string accessToken = SettingsManager.GetAccessToken();

                if (string.IsNullOrEmpty(accessToken))
                {
                    // Show login dialog
                    var loginDialog = new LoginDialog();
                    loginDialog.ShowDialog();
                    
                    accessToken = SettingsManager.GetAccessToken();
                    
                    if (string.IsNullOrEmpty(accessToken))
                    {
                        doc.Editor.WriteMessage("\nRenderiq: Authentication required. Please sign in.\n");
                        return;
                    }
                }

                // Show render dialog
                var renderDialog = new RenderDialog(doc, accessToken);
                renderDialog.ShowDialog();
            }
            catch (Exception ex)
            {
                Application.DocumentManager.MdiActiveDocument?.Editor.WriteMessage(
                    $"\nRenderiq Error: {ex.Message}\n");
            }
        }
    }
}

