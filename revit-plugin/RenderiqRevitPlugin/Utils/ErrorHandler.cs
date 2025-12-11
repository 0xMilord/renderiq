using System;
using System.Windows;
using Autodesk.Revit.UI;
using RenderiqRevitPlugin.Models;
using RenderiqRevitPlugin.Utils;

namespace RenderiqRevitPlugin.Utils
{
    /// <summary>
    /// Centralized error handling utility
    /// </summary>
    public static class ErrorHandler
    {
        /// <summary>
        /// Handle API exceptions and show user-friendly messages
        /// </summary>
        public static void HandleException(Exception ex, string context = "Operation")
        {
            Logger.LogError($"{context} failed", ex);

            string message = ex switch
            {
                RenderiqApiException apiEx => GetApiErrorMessage(apiEx),
                System.Net.Http.HttpRequestException httpEx => $"Network error: Please check your internet connection.\n\nDetails: {httpEx.Message}",
                UnauthorizedAccessException => "Authentication required. Please sign in again.",
                _ => $"An unexpected error occurred.\n\n{ex.Message}"
            };

            TaskDialog.Show("Renderiq Error", $"{context} failed:\n\n{message}");
        }

        /// <summary>
        /// Get user-friendly error message from API error
        /// </summary>
        private static string GetApiErrorMessage(RenderiqApiException ex)
        {
            return ex.StatusCode switch
            {
                401 => "Authentication failed. Please sign in again.",
                403 => "Access denied. Please check your account permissions.",
                404 => "Resource not found. Please try again.",
                429 => "Rate limit exceeded. Please wait a moment and try again.",
                500 => "Server error. Please try again later or contact support.",
                _ => $"API error ({ex.StatusCode}): {ex.Message}"
            };
        }

        /// <summary>
        /// Show success message
        /// </summary>
        public static void ShowSuccess(string message, string title = "Success")
        {
            TaskDialog.Show(title, message);
        }

        /// <summary>
        /// Show info message
        /// </summary>
        public static void ShowInfo(string message, string title = "Information")
        {
            TaskDialog.Show(title, message);
        }
    }
}

