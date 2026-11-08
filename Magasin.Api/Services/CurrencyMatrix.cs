using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Magasin.Api.Dtos;
using Magasin.Api.Mappings;

namespace Magasin.Api.Services
{
    public class CurrencyMatrix
    {
        private readonly Dictionary<string, Dictionary<string, decimal>> _matrix;
        private int _lotId;

        public CurrencyMatrix(LotTauxResponseDto dto)
        {
            _matrix = dto.ToRates();
            _lotId = dto.Id;
        }

        public bool isUpToDate(int lotId) => _lotId == lotId;
        public int LotId => _lotId;

        public bool TryGetRate(string from, string to, out decimal rate)
        {
            rate = 1m;
            if (_matrix.TryGetValue(from, out var targets) && targets.TryGetValue(to, out var foundRate))
            {
                rate = foundRate;
                return true;
            }
            return false;
        }

        public IEnumerable<string> GetAllCurrencies()
        {
            return _matrix.Keys.Union(_matrix.Values.SelectMany(v => v.Keys)).Distinct();
        }

        public IEnumerable<KeyValuePair<string, decimal>> GetRates(string from)
        {
            if (_matrix.TryGetValue(from, out var targets))
                return targets;

            return Enumerable.Empty<KeyValuePair<string, decimal>>();
        }

    }
}