using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Magasin.Api.Dtos
{
    public record PotCommunResponseDto(
        int Id,
        string Auteur,
        string Message,
        DateTime DateCreation,
        int? ProduitId,
        string? ProduitNom,
        int? VenteId,
        decimal? VenteTotal
    );
}