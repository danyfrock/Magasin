using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Magasin.Api.Database.Entities
{
    public class LigneVente
    {
        public int Id { get; set; }

        public int VenteId { get; set; }

        public int ProduitId { get; set; }

        public int Quantite { get; set; }

        public int PrixUnitaire { get; set; }

        public Vente Vente { get; set; } = null!;

        public Produit Produit { get; set; } = null!;
    }
}