using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace HireSphere.Tests.Integration.Infrastructure;

public static class HttpClientExtensions
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public static void SetBearerToken(this HttpClient client, string token)
    {
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
    }

    public static async Task<HttpResponseMessage> PostAsJsonAsync<T>(this HttpClient client, string url, T data, CancellationToken ct = default)
    {
        var json = JsonSerializer.Serialize(data, JsonOptions);
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        return await client.PostAsync(url, content, ct);
    }

    public static async Task<HttpResponseMessage> PutAsJsonAsync<T>(this HttpClient client, string url, T data, CancellationToken ct = default)
    {
        var json = JsonSerializer.Serialize(data, JsonOptions);
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        return await client.PutAsync(url, content, ct);
    }

    public static async Task<T?> ReadJsonAsync<T>(this HttpResponseMessage response, CancellationToken ct = default)
    {
        var content = await response.Content.ReadAsStringAsync(ct);
        if (string.IsNullOrWhiteSpace(content)) return default;
        return JsonSerializer.Deserialize<T>(content, JsonOptions);
    }
}
