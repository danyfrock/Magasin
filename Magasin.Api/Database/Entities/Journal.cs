using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Magasin.Api.Database.Entities
{

    public class Journal
    {
        public int Id { get; set; }

        public DateTime DateUtc { get; set; }

        public int? UtilisateurId { get; set; }

        public Utilisateur? Utilisateur { get; set; }

        public string? NomUtilisateur { get; set; }

        public string Action { get; set; } = string.Empty;

        public string TypeEntite { get; set; } = string.Empty;

        public int? EntiteId { get; set; }

        public string? AnciennesValeurs { get; set; }

        public string? NouvellesValeurs { get; set; }

        public string? NomPoste { get; set; }
    }

}