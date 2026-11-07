using Magasin.Api.Database.Entities;
using Magasin.Api.Dtos;

namespace Magasin.Api.Mappings
{
    public static class CurrencyMapping
    {
        public static LotTauxResponseDto ToDto(this LotTaux entity)
        {
            return new LotTauxResponseDto
            {
                Id = entity.Id,
                UpdatedAt = entity.UpdatedAt,
                Source = entity.Source,
                Taux = entity.Taux.Select(t => t.ToDto()).ToList()
            };
        }

        public static TauxChangeDto ToDto(this TauxChange entity)
        {
            return new TauxChangeDto
            {
                BaseCurrency = entity.BaseCurrency,
                TargetCurrency = entity.TargetCurrency,
                Rate = entity.Rate
            };
        }

        public static Dictionary<string, Dictionary<string, decimal>> ToRates(this LotTauxResponseDto dto)
        {
            return dto.Taux
                .GroupBy(t => t.BaseCurrency, StringComparer.OrdinalIgnoreCase)
                .ToDictionary(
                    g => g.Key,
                    g => g.ToDictionary(
                        t => t.TargetCurrency,
                        t => t.Rate,
                        StringComparer.OrdinalIgnoreCase),
                    StringComparer.OrdinalIgnoreCase);
        }
    }
}