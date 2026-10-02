using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Magasin.Api.Database.Entities
{
    public class Vente
    {
        public int Id { get; set; }

        public DateTime Date { get; set; }

        public int Total { get; set; }

        public ICollection<LigneVente> Lignes { get; set; } = new List<LigneVente>();

        public ICollection<LignePaiement> Paiements { get; set; } = new List<LignePaiement>();
    }
}