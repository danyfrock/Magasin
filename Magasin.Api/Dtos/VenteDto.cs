using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Magasin.Api.Dtos
{
    public record VenteDto(
        List<LigneVenteDto> Lignes,
        List<LignePaiementDto> Paiements,
        int Rendu
    );
}