using System;
using System.Collections.Generic;

namespace Magasin.Api.Services
{
    public class CurrencyConverter
    {
        private readonly CurrencyMatrix _matrix;

        public CurrencyConverter(CurrencyMatrix matrix)
        {
            _matrix = matrix;
        }

        public bool IsUpToDate(int lotId) => this.CurrencyMatrix.isUpToDate(lotId);
        public CurrencyMatrix CurrencyMatrix => this._matrix;

        public (decimal Rate, decimal Value) Convert(decimal amount, string from, string to)
        {
            if (from.Equals(to, StringComparison.OrdinalIgnoreCase))
                return (1m, amount);

            var rate = GetRate(from, to);
            return (rate, amount * rate);
        }

        public decimal GetRate(string from, string to)
        {
            if (from.Equals(to, StringComparison.OrdinalIgnoreCase))
                return 1m;

            // 1. Taux direct
            if (_matrix.TryGetRate(from, to, out var directRate))
                return directRate;

            // 2. Taux inverse
            if (_matrix.TryGetRate(to, from, out var inverseRate))
                return 1m / inverseRate;

            // 3. Chemin indirect (BFS)
            var pathRate = FindRateThroughPath(from, to);
            if (pathRate.HasValue)
                return pathRate.Value;

            throw new InvalidOperationException($"Aucun taux de change trouvé entre {from} et {to}");
        }

        private decimal? FindRateThroughPath(string from, string to)
        {
            var paths = new Queue<(string Currency, decimal Rate)>();
            var visited = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                from
            };

            paths.Enqueue((from, 1m));

            while (paths.TryDequeue(out var current))
            {
                var neighbors = _matrix.GetRates(current.Currency);

                foreach (var (currency, rate) in neighbors)
                {
                    if (!visited.Add(currency))
                        continue;

                    var cumulativeRate = current.Rate * rate;

                    if (currency.Equals(to, StringComparison.OrdinalIgnoreCase))
                        return cumulativeRate;

                    paths.Enqueue((currency, cumulativeRate));
                }
            }

            return null;
        }
    }
}