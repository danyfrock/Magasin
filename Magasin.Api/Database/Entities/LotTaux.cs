using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Magasin.Api.Database.Entities
{
    public class LotTaux
    {
        public int Id { get; set; }

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public string? Source { get; set; }

        public ICollection<TauxChange> Taux { get; set; } = new List<TauxChange>();
    }
}