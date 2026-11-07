using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Magasin.Api.Database.Entities
{
    public class TauxChange
    {
        public int Id { get; set; }

        public int LotTauxId { get; set; }

        public string BaseCurrency { get; set; } = null!;

        public string TargetCurrency { get; set; } = null!;

        public decimal Rate { get; set; }

        public LotTaux LotTaux { get; set; } = null!;
    }
}