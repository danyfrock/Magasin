using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Magasin.Api.Dtos
{
    public record VenteResponseDto(
        int Id,
        DateTime Date,
        int Total,
        List<LigneVenteResponseDto> Lignes,
        List<LignePaiementResponseDto> Paiements
    );
}