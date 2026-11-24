using System.Net.Http.Headers;
using System.Net.Http.Json;
using Magasin.Api.Dtos;

namespace Magasin.Api.Services;

public class TextSearchService
{
    private readonly HttpClient httpClient;
    private readonly string? workerUrl;
    private readonly string? bearerToken;

    public TextSearchService(
        HttpClient httpClient,
        IConfiguration configuration)
    {
        this.httpClient = httpClient;

        workerUrl = configuration["TextSearchWorker:TextSearchWorkerUrl"];
        bearerToken = configuration["TextSearchWorker:TextSearchBearerToken"];
    }

    public async Task<TextSearchResponse> SearchAsync(
        string query,
        IEnumerable<TextSearchCandidate> candidates,
        int topN = 20)
    {
        if (string.IsNullOrWhiteSpace(query) || string.IsNullOrWhiteSpace(workerUrl))
            return new TextSearchResponse { Results = [] };

        List<TextSearchCandidate> candidateList = candidates.ToList();
        if (candidateList.Count == 0)
            return new TextSearchResponse { Results = [] };

        using var request = new HttpRequestMessage(HttpMethod.Post, workerUrl);

        if (!string.IsNullOrWhiteSpace(bearerToken))
        {
            request.Headers.Authorization =
                new AuthenticationHeaderValue("Bearer", bearerToken);
        }

        request.Content = JsonContent.Create(new
        {
            query = query.Trim(),
            limit = topN,
            candidates = candidateList
        });

        using var response = await httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();

        TextSearchResponse? results =
            await response.Content.ReadFromJsonAsync<TextSearchResponse>();

        return results?? new TextSearchResponse { Results = [] };
    }
}