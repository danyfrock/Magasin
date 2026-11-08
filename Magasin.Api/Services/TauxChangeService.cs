using System.Net.Http.Json;
using System.Text.Json;
using Magasin.Api.Database;
using Magasin.Api.Database.Entities;
using Magasin.Api.Dtos;
using Magasin.Api.Mappings;
using Microsoft.EntityFrameworkCore;

namespace Magasin.Api.Services;

public class TauxChangeService
{
    private readonly MagasinDbContext dbContext;
    private readonly HttpClient httpClient;
    private readonly string workerUrl;
    private readonly int validityMinutes;

    public TauxChangeService(
        MagasinDbContext dbContext,
        HttpClient httpClient,
        IConfiguration configuration)
    {
        this.dbContext = dbContext;
        this.httpClient = httpClient;

        workerUrl = configuration["CurrencyWorkerUrl"]
            ?? "https://taux-change.l0r3nz1dan13l.workers.dev/";

        validityMinutes = configuration.GetValue<int>(
            "CurrencyValidityMinutes",
            720);
    }

    /// <summary>
    /// Retourne un lot valide.
    /// Rafraîchit automatiquement si absent ou expiré.
    /// </summary>
    public async Task<LotTauxResponseDto?> GetOrRefreshAsync()
    {
        var lot = await GetLastAsync();

        if (lot == null)
        {
            return await RefreshAsync();
        }

        var age = DateTime.UtcNow - lot.UpdatedAt;

        if (age.TotalMinutes > validityMinutes)
        {
            return await RefreshAsync();
        }

        return lot;
    }

    public async Task<LotTauxResponseDto?> GetLastAsync()
    {
        var lot = await dbContext.LotsTaux
            .AsNoTracking()
            .Include(l => l.Taux)
            .OrderByDescending(l => l.UpdatedAt)
            .FirstOrDefaultAsync();

        return lot?.ToDto();
    }

    public async Task<LotTauxResponseDto?> GetByIdAsync(int id)
    {
        var lot = await dbContext.LotsTaux
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == id);

        return lot?.ToDto();
    }

    public async Task<LotTauxResponseDto?> GetByDate(DateTime dateVente)
    {
        LotTaux? lot = await dbContext.LotsTaux
            .AsNoTracking()
            .Include(l => l.Taux)
            .Where(l => l.UpdatedAt < dateVente)
            .OrderByDescending(l => l.UpdatedAt)
            .FirstOrDefaultAsync();

        return lot?.ToDto() ?? await GetLastAsync();
    }

    public async Task<List<LotTauxResponseDto>> GetAllLotsAsync()
    {
        var lots = await dbContext.LotsTaux
            .AsNoTracking()
            .Include(l => l.Taux)
            .OrderByDescending(l => l.UpdatedAt)
            .ToListAsync();

        return lots
            .Select(x => x.ToDto())
            .ToList();
    }

    private async Task<LotTauxResponseDto?> RefreshAsync()
    {
        var response =
            await httpClient.GetFromJsonAsync<Dictionary<string, object>>(workerUrl);

        if (response == null)
        {
            return null;
        }

        var lot = new LotTaux
        {
            Source = "Cloudflare Worker",
            UpdatedAt = DateTime.UtcNow
        };

        if (response.TryGetValue("updated", out var updatedObj)
            && DateTime.TryParse(
                updatedObj?.ToString(),
                null,
                System.Globalization.DateTimeStyles.AdjustToUniversal,
                out DateTime updatedAt))
        {
            lot.UpdatedAt = DateTime.SpecifyKind(updatedAt, DateTimeKind.Utc);
        }

        var rates = response
            .Where(x => x.Key != "updated")
            .ToDictionary(
                x => x.Key,
                x => ((JsonElement)x.Value).GetDecimal());

        foreach (var baseRate in rates)
        {
            foreach (var targetRate in rates)
            {
                if (baseRate.Key == targetRate.Key)
                {
                    continue;
                }

                lot.Taux.Add(new TauxChange
                {
                    BaseCurrency = baseRate.Key,
                    TargetCurrency = targetRate.Key,
                    Rate = targetRate.Value / baseRate.Value
                });
            }
        }

        dbContext.LotsTaux.Add(lot);

        await dbContext.SaveChangesAsync();

        return lot.ToDto();
    }
}