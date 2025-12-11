using System;
using System.Windows.Controls;
using Autodesk.Revit.UI;

namespace RenderiqRevitPlugin.UI
{
    /// <summary>
    /// Status bar widget for displaying credits and render status
    /// Note: Revit doesn't have direct status bar API, this is a placeholder
    /// </summary>
    public class StatusBarWidget : IDisposable
    {
        private TextBlock _creditsTextBlock;
        private bool _disposed = false;

        public StatusBarWidget()
        {
            // In a real implementation, this would create a status bar widget
            // For now, this is a placeholder as Revit's UI API is limited
        }

        public void UpdateCredits(int credits)
        {
            if (_creditsTextBlock != null)
            {
                _creditsTextBlock.Text = $"Renderiq: {credits} credits";
            }
        }

        public void UpdateStatus(string status)
        {
            if (_creditsTextBlock != null)
            {
                _creditsTextBlock.Text = $"Renderiq: {status}";
            }
        }

        public void Dispose()
        {
            if (!_disposed)
            {
                _creditsTextBlock = null;
                _disposed = true;
            }
        }
    }
}

