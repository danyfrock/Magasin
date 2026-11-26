using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Magasin.Api.Database.Entities
{
        public class PotCommun
        {
            public int Id { get; set; }

            public int UtilisateurId { get; set; }
            public Utilisateur Utilisateur { get; set; } = null!;

            public string Message { get; set; } = string.Empty;

            public DateTime DateCreation { get; set; }

            public int? ProduitId { get; set; }
            public Produit? Produit { get; set; }

            public int? VenteId { get; set; }
            public Vente? Vente { get; set; }
        }
}