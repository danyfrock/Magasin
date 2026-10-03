using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Magasin.Api.Database.Entities
{
    public class Stock
    {
        public int Id { get; set; }

        public int IdProduit { get; set; }

        public int Quantite { get; set; }

        public required Produit Produit { get; set; }
    }
}