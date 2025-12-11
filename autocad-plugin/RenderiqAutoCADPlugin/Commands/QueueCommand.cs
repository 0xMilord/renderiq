using System;
using Autodesk.AutoCAD.ApplicationServices;
using Autodesk.AutoCAD.EditorInput;
using Autodesk.AutoCAD.Runtime;
using RenderiqAutoCADPlugin.UI;

namespace RenderiqAutoCADPlugin
{
    /// <summary>
    /// Command to view render queue
    /// Command: RENDERIQQUEUE (alias: RIQ)
    /// </summary>
    public class QueueCommand
    {
        [CommandMethod("RENDERIQQUEUE")]
        public void QueueCommandMethod()
        {
            try
            {
                // Show queue dialog (to be implemented)
                Application.DocumentManager.MdiActiveDocument.Editor.WriteMessage(
                    "\nRenderiq: Queue feature coming soon.\n");
            }
            catch (Exception ex)
            {
                Application.DocumentManager.MdiActiveDocument?.Editor.WriteMessage(
                    $"\nRenderiq Error: {ex.Message}\n");
            }
        }
    }
}

