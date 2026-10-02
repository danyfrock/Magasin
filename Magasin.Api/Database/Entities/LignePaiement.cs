using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Magasin.Api.Database.Entities
{
    public class LignePaiement
    {
        public int Id { get; set; }

        public int VenteId { get; set; }

        public string Type { get; set; } = null!;

        public string MoyenPaiement { get; set; } = null!;

        public int Montant { get; set; }

        public Vente Vente { get; set; } = null!;
    }
}