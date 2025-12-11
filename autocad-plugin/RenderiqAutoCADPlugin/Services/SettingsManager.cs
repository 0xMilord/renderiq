using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Win32;
using Newtonsoft.Json;
using RenderiqAutoCADPlugin.Models;

namespace RenderiqAutoCADPlugin.Services
{
    /// <summary>
    /// Manages plugin settings and credentials
    /// Uses Windows Registry for secure storage
    /// </summary>
    public static class SettingsManager
    {
        private const string REGISTRY_KEY = @"SOFTWARE\Renderiq\AutoCADPlugin";
        private const string SETTINGS_KEY = "Settings";
        private const string ACCESS_TOKEN_KEY = "AccessToken";
        private const string REFRESH_TOKEN_KEY = "RefreshToken";

        /// <summary>
        /// Initialize settings
        /// </summary>
        public static void Initialize()
        {
            try
            {
                using (RegistryKey key = Registry.CurrentUser.CreateSubKey(REGISTRY_KEY))
                {
                    // Initialize if needed
                }
            }
            catch
            {
                // Ignore initialization errors
            }
        }

        /// <summary>
        /// Get plugin settings
        /// </summary>
        public static PluginSettings GetSettings()
        {
            try
            {
                using (RegistryKey key = Registry.CurrentUser.OpenSubKey(REGISTRY_KEY))
                {
                    if (key != null)
                    {
                        string settingsJson = key.GetValue(SETTINGS_KEY) as string;
                        if (!string.IsNullOrEmpty(settingsJson))
                        {
                            return JsonConvert.DeserializeObject<PluginSettings>(settingsJson);
                        }
                    }
                }
            }
            catch
            {
                // Return default settings
            }

            return new PluginSettings();
        }

        /// <summary>
        /// Save plugin settings
        /// </summary>
        public static void SaveSettings(PluginSettings settings)
        {
            try
            {
                using (RegistryKey key = Registry.CurrentUser.CreateSubKey(REGISTRY_KEY))
                {
                    string settingsJson = JsonConvert.SerializeObject(settings);
                    key.SetValue(SETTINGS_KEY, settingsJson, RegistryValueKind.String);
                }
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to save settings: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Get access token (encrypted)
        /// </summary>
        public static string GetAccessToken()
        {
            try
            {
                using (RegistryKey key = Registry.CurrentUser.OpenSubKey(REGISTRY_KEY))
                {
                    if (key != null)
                    {
                        string encryptedToken = key.GetValue(ACCESS_TOKEN_KEY) as string;
                        if (!string.IsNullOrEmpty(encryptedToken))
                        {
                            return Decrypt(encryptedToken);
                        }
                    }
                }
            }
            catch
            {
                // Return null on error
            }

            return null;
        }

        /// <summary>
        /// Save access token (encrypted)
        /// </summary>
        public static void SaveAccessToken(string token)
        {
            try
            {
                using (RegistryKey key = Registry.CurrentUser.CreateSubKey(REGISTRY_KEY))
                {
                    string encryptedToken = Encrypt(token);
                    key.SetValue(ACCESS_TOKEN_KEY, encryptedToken, RegistryValueKind.String);
                }
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to save access token: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Clear access token
        /// </summary>
        public static void ClearAccessToken()
        {
            try
            {
                using (RegistryKey key = Registry.CurrentUser.CreateSubKey(REGISTRY_KEY))
                {
                    key.DeleteValue(ACCESS_TOKEN_KEY, false);
                    key.DeleteValue(REFRESH_TOKEN_KEY, false);
                }
            }
            catch
            {
                // Ignore errors
            }
        }

        /// <summary>
        /// Simple encryption (for production, use Windows DPAPI)
        /// </summary>
        private static string Encrypt(string plainText)
        {
            // Use Windows Data Protection API for secure storage
            byte[] plainBytes = Encoding.UTF8.GetBytes(plainText);
            byte[] encryptedBytes = System.Security.Cryptography.ProtectedData.Protect(
                plainBytes,
                null,
                DataProtectionScope.CurrentUser
            );
            return Convert.ToBase64String(encryptedBytes);
        }

        /// <summary>
        /// Simple decryption
        /// </summary>
        private static string Decrypt(string encryptedText)
        {
            try
            {
                byte[] encryptedBytes = Convert.FromBase64String(encryptedText);
                byte[] plainBytes = System.Security.Cryptography.ProtectedData.Unprotect(
                    encryptedBytes,
                    null,
                    DataProtectionScope.CurrentUser
                );
                return Encoding.UTF8.GetString(plainBytes);
            }
            catch
            {
                return null;
            }
        }
    }

    /// <summary>
    /// Plugin Settings Model
    /// </summary>
    public class PluginSettings
    {
        public string AccessToken { get; set; }
        public string RefreshToken { get; set; }
        public string DefaultQuality { get; set; } = "high";
        public string DefaultStyle { get; set; } = "photorealistic";
        public string DefaultAspectRatio { get; set; } = "16:9";
        public string DefaultProjectId { get; set; }
        public bool AutoLogin { get; set; } = true;
        public int ExportResolution { get; set; } = 4096;
    }
}

