using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using Autodesk.AutoCAD.ApplicationServices;
using Autodesk.AutoCAD.DatabaseServices;
using Autodesk.AutoCAD.Geometry;
using Autodesk.AutoCAD.EditorInput;
using RenderiqAutoCADPlugin.Models;

namespace RenderiqAutoCADPlugin.Services
{
    /// <summary>
    /// Service for exporting AutoCAD views to images
    /// </summary>
    public class ViewExporter
    {
        /// <summary>
        /// Export current view to image
        /// </summary>
        public static byte[] ExportViewToImage(Document doc, int resolution = 4096)
        {
            try
            {
                if (doc == null)
                {
                    throw new InvalidOperationException("No active document");
                }

                Editor ed = doc.Editor;

                // Get current viewport
                ViewTableRecord currentView = GetCurrentView(doc);
                
                if (currentView == null)
                {
                    // Fallback to screenshot method
                    return CaptureViewportScreenshot(doc, resolution);
                }

                // Export view using Plot functionality or direct rendering
                return ExportViewUsingPlot(doc, currentView, resolution);
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to export view: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Get current view from document
        /// </summary>
        private static ViewTableRecord GetCurrentView(Document doc)
        {
            try
            {
                Editor ed = doc.Editor;
                Database db = doc.Database;
                
                using (Transaction tr = db.TransactionManager.StartTransaction())
                {
                    ViewTableRecord view = ed.GetCurrentView();
                    tr.Commit();
                    return view;
                }
            }
            catch
            {
                return null;
            }
        }

        /// <summary>
        /// Export view using Plot functionality
        /// </summary>
        private static byte[] ExportViewUsingPlot(Document doc, ViewTableRecord view, int resolution)
        {
            try
            {
                // Use Plot API to export current view
                // This is a simplified approach - in production, use proper Plot API
                
                // For now, fallback to screenshot
                return CaptureViewportScreenshot(doc, resolution);
            }
            catch
            {
                return CaptureViewportScreenshot(doc, resolution);
            }
        }

        /// <summary>
        /// Capture viewport screenshot (fallback method)
        /// </summary>
        private static byte[] CaptureViewportScreenshot(Document doc, int resolution)
        {
            try
            {
                // Get active viewport
                System.Windows.Rect viewportRect = GetViewportRect(doc);
                
                if (viewportRect.Width == 0 || viewportRect.Height == 0)
                {
                    throw new InvalidOperationException("Invalid viewport size");
                }

                // Create bitmap
                int width = (int)viewportRect.Width;
                int height = (int)viewportRect.Height;

                // Scale to requested resolution while maintaining aspect ratio
                double aspectRatio = viewportRect.Width / viewportRect.Height;
                if (aspectRatio > 1)
                {
                    width = resolution;
                    height = (int)(resolution / aspectRatio);
                }
                else
                {
                    height = resolution;
                    width = (int)(resolution * aspectRatio);
                }

                using (Bitmap bitmap = new Bitmap(width, height))
                {
                    using (Graphics graphics = Graphics.FromImage(bitmap))
                    {
                        // Fill with white background
                        graphics.Clear(Color.White);

                        // Note: In production, you would use AutoCAD's rendering API
                        // to properly capture the viewport content
                        // This is a placeholder that creates a blank image
                        // Real implementation would use Plot API or GraphicsInterface
                    }

                    // Convert to bytes
                    using (MemoryStream ms = new MemoryStream())
                    {
                        bitmap.Save(ms, ImageFormat.Png);
                        return ms.ToArray();
                    }
                }
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to capture screenshot: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Get viewport rectangle
        /// </summary>
        private static System.Windows.Rect GetViewportRect(Document doc)
        {
            try
            {
                // Get viewport bounds from document
                // This is a simplified approach
                return new System.Windows.Rect(0, 0, 1920, 1080); // Default size
            }
            catch
            {
                return new System.Windows.Rect(0, 0, 1920, 1080);
            }
        }

        /// <summary>
        /// Export view with specific settings
        /// </summary>
        public static byte[] ExportViewWithSettings(
            Document doc,
            RenderSettings settings,
            int resolution = 4096)
        {
            // Adjust resolution based on quality
            int actualResolution = settings.Quality switch
            {
                "standard" => 1920,
                "high" => 4096,
                "ultra" => 8192,
                _ => 4096
            };

            return ExportViewToImage(doc, actualResolution);
        }

        /// <summary>
        /// Export selected objects
        /// </summary>
        public static byte[] ExportSelectedObjects(Document doc, ObjectId[] objectIds, int resolution = 4096)
        {
            try
            {
                // Isolate selected objects
                // Export only those objects
                // This would require more complex implementation
                
                // For now, export current view
                return ExportViewToImage(doc, resolution);
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to export selected objects: {ex.Message}", ex);
            }
        }
    }
}

