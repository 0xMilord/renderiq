using System;
using System.Collections.Generic;
using Newtonsoft.Json;

namespace RenderiqAutoCADPlugin.Models
{
    /// <summary>
    /// API Response wrapper
    /// </summary>
    public class ApiResponse<T>
    {
        [JsonProperty("success")]
        public bool Success { get; set; }

        [JsonProperty("data")]
        public T Data { get; set; }
    }

    /// <summary>
    /// API Error Response
    /// </summary>
    public class ApiErrorResponse
    {
        [JsonProperty("success")]
        public bool Success { get; set; }

        [JsonProperty("error")]
        public string Error { get; set; }

        [JsonProperty("errorCode")]
        public string ErrorCode { get; set; }

        [JsonProperty("details")]
        public Dictionary<string, object> Details { get; set; }
    }

    /// <summary>
    /// Authentication Response
    /// </summary>
    public class AuthResponse
    {
        [JsonProperty("success")]
        public bool Success { get; set; }

        [JsonProperty("access_token")]
        public string AccessToken { get; set; }

        [JsonProperty("refresh_token")]
        public string RefreshToken { get; set; }

        [JsonProperty("expires_at")]
        public string ExpiresAt { get; set; }

        [JsonProperty("token_type")]
        public string TokenType { get; set; }

        [JsonProperty("user")]
        public UserInfo User { get; set; }
    }

    /// <summary>
    /// User Information
    /// </summary>
    public class UserInfo
    {
        [JsonProperty("id")]
        public string Id { get; set; }

        [JsonProperty("email")]
        public string Email { get; set; }

        [JsonProperty("name")]
        public string Name { get; set; }

        [JsonProperty("created_at")]
        public string CreatedAt { get; set; }

        [JsonProperty("credits")]
        public CreditsInfo Credits { get; set; }
    }

    /// <summary>
    /// Credits Information
    /// </summary>
    public class CreditsInfo
    {
        [JsonProperty("balance")]
        public int Balance { get; set; }

        [JsonProperty("totalEarned")]
        public int TotalEarned { get; set; }

        [JsonProperty("totalSpent")]
        public int TotalSpent { get; set; }

        [JsonProperty("monthlyEarned")]
        public int MonthlyEarned { get; set; }

        [JsonProperty("monthlySpent")]
        public int MonthlySpent { get; set; }
    }

    /// <summary>
    /// Render Settings
    /// </summary>
    public class RenderSettings
    {
        public string Prompt { get; set; }
        public string Quality { get; set; } = "high";
        public string AspectRatio { get; set; } = "16:9";
        public string Style { get; set; } = "photorealistic";
        public string Model { get; set; }
    }

    /// <summary>
    /// Render Response
    /// </summary>
    public class RenderResponse
    {
        [JsonProperty("renderId")]
        public string RenderId { get; set; }

        [JsonProperty("id")]
        public string Id { get; set; }

        [JsonProperty("status")]
        public string Status { get; set; }

        [JsonProperty("creditsCost")]
        public int CreditsCost { get; set; }

        [JsonProperty("estimatedTime")]
        public int EstimatedTime { get; set; }
    }

    /// <summary>
    /// Render Status
    /// </summary>
    public class RenderStatus
    {
        [JsonProperty("renderId")]
        public string RenderId { get; set; }

        [JsonProperty("status")]
        public string Status { get; set; }

        [JsonProperty("outputUrl")]
        public string OutputUrl { get; set; }

        [JsonProperty("progress")]
        public int? Progress { get; set; }

        [JsonProperty("estimatedTimeRemaining")]
        public int? EstimatedTimeRemaining { get; set; }

        [JsonProperty("error")]
        public string Error { get; set; }
    }

    /// <summary>
    /// Resumable Upload Session
    /// </summary>
    public class ResumableUploadSession
    {
        [JsonProperty("sessionId")]
        public string SessionId { get; set; }

        [JsonProperty("uploadUrl")]
        public string UploadUrl { get; set; }

        [JsonProperty("expiresAt")]
        public string ExpiresAt { get; set; }

        [JsonProperty("bucket")]
        public string Bucket { get; set; }

        [JsonProperty("filePath")]
        public string FilePath { get; set; }
    }

    /// <summary>
    /// Upload Result
    /// </summary>
    public class UploadResult
    {
        [JsonProperty("url")]
        public string Url { get; set; }

        [JsonProperty("key")]
        public string Key { get; set; }
    }

    /// <summary>
    /// Project Information
    /// </summary>
    public class ProjectInfo
    {
        [JsonProperty("id")]
        public string Id { get; set; }

        [JsonProperty("name")]
        public string Name { get; set; }

        [JsonProperty("slug")]
        public string Slug { get; set; }

        [JsonProperty("description")]
        public string Description { get; set; }

        [JsonProperty("createdAt")]
        public string CreatedAt { get; set; }

        [JsonProperty("renderCount")]
        public int RenderCount { get; set; }
    }

    /// <summary>
    /// Custom Exception for API errors
    /// </summary>
    public class RenderiqApiException : Exception
    {
        public int StatusCode { get; }

        public RenderiqApiException(string message, int statusCode) : base(message)
        {
            StatusCode = statusCode;
        }
    }
}

