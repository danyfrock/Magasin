using System;
using System.IO;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Magasin.Api.Dtos;
using Microsoft.Extensions.Configuration;

namespace Magasin.Api.Services;

public class ImageAnalysisService
{
    private readonly HttpClient _httpClient;
    private readonly string _workerUrl;

    public ImageAnalysisService(
        HttpClient httpClient,
        IConfiguration configuration)
    {
        _httpClient = httpClient;

        _workerUrl = configuration["ImageAnalysisWorkerUrl"]
            ?? throw new InvalidOperationException(
                "Configuration 'ImageAnalysisWorkerUrl' manquante.");
    }

    public async Task<ImageAnalysisResultDto> AnalyzeAsync(
        ImageSwitch imageSwitch)
    {
        ArgumentNullException.ThrowIfNull(imageSwitch);

        var imageData = imageSwitch.ImageData
            ?? await CreateImageDataAsync(imageSwitch.ImageResponse);

        return await AnalyzeAsync(imageData);
    }

    private async Task<ImageAnalysisResultDto> AnalyzeAsync(
        ImageDataDto imageData)
    {
        ArgumentNullException.ThrowIfNull(imageData);

        if (imageData.Data.Length == 0)
        {
            throw new ArgumentException(
                "L'image est vide.",
                nameof(imageData));
        }

        var payload = new
        {
            imageBase64 = Convert.ToBase64String(imageData.Data)
        };

        using var response =
            await _httpClient.PostAsJsonAsync(_workerUrl, payload);

        response.EnsureSuccessStatusCode();

        var result =
            await response.Content.ReadFromJsonAsync<ImageAnalysisResultDto>();

        return result
            ?? throw new InvalidOperationException(
                "Le worker n'a retourné aucun résultat.");
    }

    private static async Task<ImageDataDto> CreateImageDataAsync(
        ImageResponseDto? imageResponse)
    {
        if (imageResponse is null)
        {
            throw new InvalidOperationException(
                "ImageSwitch ne contient aucune image.");
        }

        if (!File.Exists(imageResponse.ImagePath))
        {
            throw new FileNotFoundException(
                $"Image introuvable : {imageResponse.ImagePath}");
        }

        var bytes = await File.ReadAllBytesAsync(
            imageResponse.ImagePath);

        return new ImageDataDto(
            bytes,
            imageResponse.ContentType);
    }
}