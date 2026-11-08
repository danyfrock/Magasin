using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Magasin.Api.Dtos
{
    public record LignePaiementResponseDto(
        int Id,
        string Type,
        string MoyenPaiement,
        decimal Montant,
        string? Devise,
        decimal? MontantOriginal
    );
}