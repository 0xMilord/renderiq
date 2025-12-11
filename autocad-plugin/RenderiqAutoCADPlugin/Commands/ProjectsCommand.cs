using System;
using Autodesk.AutoCAD.ApplicationServices;
using Autodesk.AutoCAD.EditorInput;
using Autodesk.AutoCAD.Runtime;
using RenderiqAutoCADPlugin.Services;
using RenderiqAutoCADPlugin.UI;

namespace RenderiqAutoCADPlugin
{
    /// <summary>
    /// Command to manage projects
    /// Command: RENDERIQPROJECTS
    /// </summary>
    public class ProjectsCommand
    {
        [CommandMethod("RENDERIQPROJECTS")]
        public void ProjectsCommandMethod()
        {
            try
            {
                string accessToken = SettingsManager.GetAccessToken();

                if (string.IsNullOrEmpty(accessToken))
                {
                    Application.DocumentManager.MdiActiveDocument.Editor.WriteMessage(
                        "\nRenderiq: Please sign in to view your projects. Use RENDERIQSETTINGS command.\n");
                    return;
                }

                // Show projects dialog
                var projectsDialog = new ProjectsDialog(accessToken);
                projectsDialog.ShowDialog();
            }
            catch (Exception ex)
            {
                Application.DocumentManager.MdiActiveDocument?.Editor.WriteMessage(
                    $"\nRenderiq Error: {ex.Message}\n");
            }
        }
    }
}

