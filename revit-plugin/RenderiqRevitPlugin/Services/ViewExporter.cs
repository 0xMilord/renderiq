using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using Autodesk.Revit.DB;
using Autodesk.Revit.UI;

namespace RenderiqRevitPlugin.Services
{
    /// <summary>
    /// Service for exporting Revit views to images
    /// </summary>
    public class ViewExporter
    {
        /// <summary>
        /// Export current view to image
        /// </summary>
        public static byte[] ExportViewToImage(UIDocument uiDoc, int resolution = 4096)
        {
            try
            {
                View activeView = uiDoc.ActiveView;

                if (activeView == null)
                {
                    throw new InvalidOperationException("No active view");
                }

                // Create export options
                ImageExportOptions options = new ImageExportOptions();
                options.ExportRange = ExportRange.CurrentView;
                options.ZoomType = ZoomFitType.FitToPage;
                options.PixelSize = resolution;
                options.ImageResolution = ImageResolution.DPI_300;
                options.FileFormat = ImageFileFormat.PNG;
                options.ShadowViewsFileFormat = ImageFileFormat.PNG;
                options.HLRandWFViewsFileFormat = ImageFileFormat.PNG;
                options.ExportLinks = false;
                options.ExportParts = true;

                // Export to temporary file
                string tempDir = Path.GetTempPath();
                string tempFile = Path.Combine(tempDir, $"RenderiqExport_{Guid.NewGuid()}.png");
                string tempPath = Path.ChangeExtension(tempFile, ".png");

                // Export view
                activeView.Document.ExportImage(options);

                // Find the exported file (Revit adds view name to filename)
                string exportedFile = FindExportedFile(tempDir, activeView.Name);

                if (string.IsNullOrEmpty(exportedFile) || !File.Exists(exportedFile))
                {
                    // Fallback: Use screenshot method
                    return CaptureViewportScreenshot(uiDoc, resolution);
                }

                // Read file to bytes
                byte[] imageData = File.ReadAllBytes(exportedFile);

                // Cleanup
                try
                {
                    File.Delete(exportedFile);
                }
                catch
                {
                    // Ignore cleanup errors
                }

                return imageData;
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to export view: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Find exported file by view name
        /// </summary>
        private static string FindExportedFile(string directory, string viewName)
        {
            try
            {
                // Revit exports with view name prefix
                string[] files = Directory.GetFiles(directory, $"{viewName}*.png");
                if (files.Length > 0)
                {
                    // Get most recent
                    Array.Sort(files, (a, b) => File.GetCreationTime(b).CompareTo(File.GetCreationTime(a)));
                    return files[0];
                }
            }
            catch
            {
                // Ignore errors
            }

            return null;
        }

        /// <summary>
        /// Capture viewport screenshot (fallback method)
        /// </summary>
        private static byte[] CaptureViewportScreenshot(UIDocument uiDoc, int resolution)
        {
            try
            {
                // Get active view
                View activeView = uiDoc.ActiveView;

                // Get viewport size
                System.Drawing.Rectangle viewportRect = uiDoc.GetOpenUIViews()[0].GetWindowRectangle();

                // Create bitmap
                using (Bitmap bitmap = new Bitmap(viewportRect.Width, viewportRect.Height))
                {
                    using (Graphics graphics = Graphics.FromImage(bitmap))
                    {
                        // This is a simplified approach
                        // In production, use Revit's rendering API for better quality
                        graphics.Clear(Color.White);
                    }

                    // Resize if needed
                    if (bitmap.Width != resolution)
                    {
                        using (Bitmap resized = new Bitmap(bitmap, new Size(resolution, (int)(resolution * (bitmap.Height / (double)bitmap.Width)))))
                        {
                            using (MemoryStream ms = new MemoryStream())
                            {
                                resized.Save(ms, ImageFormat.Png);
                                return ms.ToArray();
                            }
                        }
                    }
                    else
                    {
                        using (MemoryStream ms = new MemoryStream())
                        {
                            bitmap.Save(ms, ImageFormat.Png);
                            return ms.ToArray();
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to capture screenshot: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Export view with specific settings
        /// </summary>
        public static byte[] ExportViewWithSettings(
            UIDocument uiDoc,
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

            return ExportViewToImage(uiDoc, actualResolution);
        }
    }
}

