using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Magasin.Api.Dtos
{
    public record LigneVenteResponseDto(
        int Id,
        int ProduitId,
        string ProduitNom,
        int Quantite,
        int PrixUnitaire
    );
}