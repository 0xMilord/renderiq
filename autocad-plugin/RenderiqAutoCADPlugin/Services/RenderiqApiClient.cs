using System;
using System.Collections.Generic;
using System.IO;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;
using RenderiqAutoCADPlugin.Models;

namespace RenderiqAutoCADPlugin.Services
{
    /// <summary>
    /// Client for Renderiq Plugin API
    /// Follows the unified plugin API architecture (same as Revit plugin)
    /// </summary>
    public class RenderiqApiClient
    {
        private const string API_BASE_URL = "https://renderiq.io/api/plugins";
        private readonly HttpClient _httpClient;
        private string _accessToken;

        public RenderiqApiClient(string accessToken = null)
        {
            _httpClient = new HttpClient();
            _httpClient.BaseAddress = new Uri(API_BASE_URL);
            _httpClient.DefaultRequestHeaders.Add("X-Renderiq-Platform", "autocad");
            _httpClient.DefaultRequestHeaders.Add("User-Agent", "Renderiq-AutoCAD-Plugin/1.0.0");
            
            if (!string.IsNullOrEmpty(accessToken))
            {
                SetAccessToken(accessToken);
            }
        }

        public void SetAccessToken(string accessToken)
        {
            _accessToken = accessToken;
            _httpClient.DefaultRequestHeaders.Authorization = 
                new AuthenticationHeaderValue("Bearer", accessToken);
        }

        /// <summary>
        /// Sign in with email and password
        /// </summary>
        public async Task<AuthResponse> SignInAsync(string email, string password)
        {
            try
            {
                var request = new
                {
                    email,
                    password
                };

                var content = new StringContent(
                    JsonConvert.SerializeObject(request),
                    Encoding.UTF8,
                    "application/json"
                );

                var response = await _httpClient.PostAsync("/auth/signin", content);
                var responseContent = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    var result = JsonConvert.DeserializeObject<AuthResponse>(responseContent);
                    if (result.Success && !string.IsNullOrEmpty(result.AccessToken))
                    {
                        SetAccessToken(result.AccessToken);
                    }
                    return result;
                }
                else
                {
                    var error = JsonConvert.DeserializeObject<ApiErrorResponse>(responseContent);
                    throw new RenderiqApiException(error?.Error ?? "Sign in failed", (int)response.StatusCode);
                }
            }
            catch (HttpRequestException ex)
            {
                throw new RenderiqApiException($"Network error: {ex.Message}", 0);
            }
        }

        /// <summary>
        /// Refresh access token
        /// </summary>
        public async Task<AuthResponse> RefreshTokenAsync(string refreshToken)
        {
            try
            {
                var request = new
                {
                    refresh_token = refreshToken
                };

                var content = new StringContent(
                    JsonConvert.SerializeObject(request),
                    Encoding.UTF8,
                    "application/json"
                );

                var response = await _httpClient.PostAsync("/auth/refresh", content);
                var responseContent = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    var result = JsonConvert.DeserializeObject<AuthResponse>(responseContent);
                    if (result.Success && !string.IsNullOrEmpty(result.AccessToken))
                    {
                        SetAccessToken(result.AccessToken);
                    }
                    return result;
                }
                else
                {
                    var error = JsonConvert.DeserializeObject<ApiErrorResponse>(responseContent);
                    throw new RenderiqApiException(error?.Error ?? "Token refresh failed", (int)response.StatusCode);
                }
            }
            catch (HttpRequestException ex)
            {
                throw new RenderiqApiException($"Network error: {ex.Message}", 0);
            }
        }

        /// <summary>
        /// Get current user info
        /// </summary>
        public async Task<UserInfo> GetUserInfoAsync()
        {
            try
            {
                var response = await _httpClient.GetAsync("/auth/me");
                var responseContent = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    var result = JsonConvert.DeserializeObject<ApiResponse<UserInfo>>(responseContent);
                    return result.Data;
                }
                else
                {
                    var error = JsonConvert.DeserializeObject<ApiErrorResponse>(responseContent);
                    throw new RenderiqApiException(error?.Error ?? "Failed to get user info", (int)response.StatusCode);
                }
            }
            catch (HttpRequestException ex)
            {
                throw new RenderiqApiException($"Network error: {ex.Message}", 0);
            }
        }

        /// <summary>
        /// Get credit balance
        /// </summary>
        public async Task<CreditsInfo> GetCreditsAsync()
        {
            try
            {
                var response = await _httpClient.GetAsync("/credits");
                var responseContent = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    var result = JsonConvert.DeserializeObject<ApiResponse<CreditsInfo>>(responseContent);
                    return result.Data;
                }
                else
                {
                    var error = JsonConvert.DeserializeObject<ApiErrorResponse>(responseContent);
                    throw new RenderiqApiException(error?.Error ?? "Failed to get credits", (int)response.StatusCode);
                }
            }
            catch (HttpRequestException ex)
            {
                throw new RenderiqApiException($"Network error: {ex.Message}", 0);
            }
        }

        /// <summary>
        /// Create render request
        /// </summary>
        public async Task<RenderResponse> CreateRenderAsync(
            byte[] imageData,
            string imageType,
            RenderSettings settings,
            string projectId = null,
            string callbackUrl = null)
        {
            try
            {
                using (var formData = new MultipartFormDataContent())
                {
                    // Add image data
                    var imageContent = new ByteArrayContent(imageData);
                    imageContent.Headers.ContentType = new MediaTypeHeaderValue(imageType);
                    formData.Add(imageContent, "uploadedImageData", "render_image.png");
                    formData.Add(new StringContent(imageType), "uploadedImageType");

                    // Add render settings
                    if (!string.IsNullOrEmpty(settings.Prompt))
                    {
                        formData.Add(new StringContent(settings.Prompt), "prompt");
                    }
                    formData.Add(new StringContent(settings.Quality), "quality");
                    formData.Add(new StringContent(settings.AspectRatio), "aspectRatio");
                    formData.Add(new StringContent(settings.Style), "style");
                    formData.Add(new StringContent("image"), "type");

                    if (!string.IsNullOrEmpty(projectId))
                    {
                        formData.Add(new StringContent(projectId), "projectId");
                    }

                    if (!string.IsNullOrEmpty(callbackUrl))
                    {
                        formData.Add(new StringContent(callbackUrl), "callback_url");
                    }

                    var response = await _httpClient.PostAsync("/renders", formData);
                    var responseContent = await response.Content.ReadAsStringAsync();

                    if (response.IsSuccessStatusCode)
                    {
                        var result = JsonConvert.DeserializeObject<ApiResponse<RenderResponse>>(responseContent);
                        return result.Data;
                    }
                    else
                    {
                        var error = JsonConvert.DeserializeObject<ApiErrorResponse>(responseContent);
                        throw new RenderiqApiException(error?.Error ?? "Render creation failed", (int)response.StatusCode);
                    }
                }
            }
            catch (HttpRequestException ex)
            {
                throw new RenderiqApiException($"Network error: {ex.Message}", 0);
            }
        }

        /// <summary>
        /// Get render status
        /// </summary>
        public async Task<RenderStatus> GetRenderStatusAsync(string renderId)
        {
            try
            {
                var response = await _httpClient.GetAsync($"/renders/{renderId}");
                var responseContent = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    var result = JsonConvert.DeserializeObject<ApiResponse<RenderStatus>>(responseContent);
                    return result.Data;
                }
                else
                {
                    var error = JsonConvert.DeserializeObject<ApiErrorResponse>(responseContent);
                    throw new RenderiqApiException(error?.Error ?? "Failed to get render status", (int)response.StatusCode);
                }
            }
            catch (HttpRequestException ex)
            {
                throw new RenderiqApiException($"Network error: {ex.Message}", 0);
            }
        }

        /// <summary>
        /// Validate access token
        /// </summary>
        public async Task<bool> ValidateToken(string token)
        {
            try
            {
                var tempClient = new RenderiqApiClient(token);
                var userInfo = await tempClient.GetUserInfoAsync();
                return userInfo != null;
            }
            catch
            {
                return false;
            }
        }

        /// <summary>
        /// Initialize resumable upload for large files
        /// </summary>
        public async Task<ResumableUploadSession> InitResumableUploadAsync(
            string fileName,
            string contentType,
            long totalSize,
            string bucket = "uploads",
            string projectSlug = null)
        {
            try
            {
                var request = new
                {
                    fileName,
                    contentType,
                    totalSize,
                    bucket,
                    projectSlug
                };

                var content = new StringContent(
                    JsonConvert.SerializeObject(request),
                    Encoding.UTF8,
                    "application/json"
                );

                var response = await _httpClient.PostAsync("/uploads/resumable/init", content);
                var responseContent = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    var result = JsonConvert.DeserializeObject<ApiResponse<ResumableUploadSession>>(responseContent);
                    return result.Data;
                }
                else
                {
                    var error = JsonConvert.DeserializeObject<ApiErrorResponse>(responseContent);
                    throw new RenderiqApiException(error?.Error ?? "Failed to initialize upload", (int)response.StatusCode);
                }
            }
            catch (HttpRequestException ex)
            {
                throw new RenderiqApiException($"Network error: {ex.Message}", 0);
            }
        }

        /// <summary>
        /// Finalize resumable upload
        /// </summary>
        public async Task<UploadResult> FinalizeResumableUploadAsync(string sessionId)
        {
            try
            {
                var response = await _httpClient.PostAsync($"/uploads/resumable/{sessionId}/finalize", null);
                var responseContent = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    var result = JsonConvert.DeserializeObject<ApiResponse<UploadResult>>(responseContent);
                    return result.Data;
                }
                else
                {
                    var error = JsonConvert.DeserializeObject<ApiErrorResponse>(responseContent);
                    throw new RenderiqApiException(error?.Error ?? "Failed to finalize upload", (int)response.StatusCode);
                }
            }
            catch (HttpRequestException ex)
            {
                throw new RenderiqApiException($"Network error: {ex.Message}", 0);
            }
        }

        /// <summary>
        /// Get user projects
        /// </summary>
        public async Task<IEnumerable<ProjectInfo>> GetProjectsAsync()
        {
            try
            {
                var response = await _httpClient.GetAsync("/projects");
                var responseContent = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    var result = JsonConvert.DeserializeObject<ApiResponse<IEnumerable<ProjectInfo>>>(responseContent);
                    return result.Data ?? new List<ProjectInfo>();
                }
                else
                {
                    var error = JsonConvert.DeserializeObject<ApiErrorResponse>(responseContent);
                    throw new RenderiqApiException(error?.Error ?? "Failed to get projects", (int)response.StatusCode);
                }
            }
            catch (HttpRequestException ex)
            {
                throw new RenderiqApiException($"Network error: {ex.Message}", 0);
            }
        }

        /// <summary>
        /// Create new project
        /// </summary>
        public async Task<ProjectInfo> CreateProjectAsync(string name, string description = null)
        {
            try
            {
                var request = new
                {
                    name,
                    description
                };

                var content = new StringContent(
                    JsonConvert.SerializeObject(request),
                    Encoding.UTF8,
                    "application/json"
                );

                var response = await _httpClient.PostAsync("/projects", content);
                var responseContent = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    var result = JsonConvert.DeserializeObject<ApiResponse<ProjectInfo>>(responseContent);
                    return result.Data;
                }
                else
                {
                    var error = JsonConvert.DeserializeObject<ApiErrorResponse>(responseContent);
                    throw new RenderiqApiException(error?.Error ?? "Failed to create project", (int)response.StatusCode);
                }
            }
            catch (HttpRequestException ex)
            {
                throw new RenderiqApiException($"Network error: {ex.Message}", 0);
            }
        }

        public void Dispose()
        {
            _httpClient?.Dispose();
        }
    }
}

