using System;
using System.Diagnostics;

namespace RenderiqAutoCADPlugin.Utils
{
    /// <summary>
    /// Simple logger utility for plugin
    /// </summary>
    public static class Logger
    {
        public static void Log(string message)
        {
            Debug.WriteLine($"[Renderiq] {DateTime.Now:yyyy-MM-dd HH:mm:ss} - {message}");
        }

        public static void LogError(string message, Exception ex = null)
        {
            string errorMessage = $"[Renderiq ERROR] {DateTime.Now:yyyy-MM-dd HH:mm:ss} - {message}";
            if (ex != null)
            {
                errorMessage += $"\nException: {ex.Message}\nStack Trace: {ex.StackTrace}";
            }
            Debug.WriteLine(errorMessage);
        }

        public static void LogWarning(string message)
        {
            Debug.WriteLine($"[Renderiq WARNING] {DateTime.Now:yyyy-MM-dd HH:mm:ss} - {message}");
        }
    }
}

