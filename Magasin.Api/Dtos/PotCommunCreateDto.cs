using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Magasin.Api.Dtos
{
    public record PotCommunCreateDto(
        int UtilisateurId,
        string Message,
        int? ProduitId,
        VenteDto? Vente
    );
}