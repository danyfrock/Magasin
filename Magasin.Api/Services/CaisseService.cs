using Magasin.Api.Dtos;
using Microsoft.Extensions.Configuration;

namespace Magasin.Api.Services
{
    public class CaisseService
    {
        private readonly IConfiguration _configuration;
        private readonly TauxChangeService _tauxChangeService;

        private CurrencyConverter? _converter;

        public CaisseService(
            IConfiguration configuration,
            TauxChangeService tauxChangeService)
        {
            _configuration = configuration;
            _tauxChangeService = tauxChangeService;
        }

        private async Task<CurrencyConverter> GetConverterAsync()
        {
            var lot = await _tauxChangeService.GetOrRefreshAsync();

            if (lot == null)
                throw new InvalidOperationException(
                    "Aucun lot de taux disponible.");

            if (_converter == null)
            {
                _converter = new CurrencyConverter(
                    new CurrencyMatrix(lot));

                return _converter;
            }

            if (!_converter.IsUpToDate(lot.Id))
            {
                _converter = new CurrencyConverter(
                    new CurrencyMatrix(lot));
            }

            return _converter;
        }

        public string GetDeviseCaisse()
        {
            return _configuration["CaisseSettings:DeviseCaisse"] ?? "XOF";
        }

        public async Task<List<string>> GetCurrenciesAsync()
        {
            var converter = await GetConverterAsync();

            return converter
                .CurrencyMatrix
                .GetAllCurrencies()
                .OrderBy(x => x)
                .ToList();
        }

        public async Task<ConvertResponseDto> ConvertirAsync(
            decimal montant,
            string from,
            string to)
        {
            var converter = await GetConverterAsync();
            var lotId = converter.CurrencyMatrix.LotId;
            var (rate, montantCible) = converter.Convert(montant, from, to);

            return new ConvertResponseDto(
                From: from,
                To: to,
                MontantOrigine: montant,
                MontantCible: montantCible,
                IdLot: lotId,
                Rate: rate
            );
        }
    }
}