using System;
using System.Windows;
using Autodesk.AutoCAD.ApplicationServices;
using RenderiqAutoCADPlugin.Models;
using RenderiqAutoCADPlugin.Utils;

namespace RenderiqAutoCADPlugin.Utils
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

            MessageBox.Show(
                $"{context} failed:\n\n{message}",
                "Renderiq Error",
                MessageBoxButton.OK,
                MessageBoxImage.Error);
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
            MessageBox.Show(message, title, MessageBoxButton.OK, MessageBoxImage.Information);
        }

        /// <summary>
        /// Show info message
        /// </summary>
        public static void ShowInfo(string message, string title = "Information")
        {
            MessageBox.Show(message, title, MessageBoxButton.OK, MessageBoxImage.Information);
        }
    }
}

