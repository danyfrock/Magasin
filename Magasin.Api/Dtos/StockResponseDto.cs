using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Magasin.Api.Dtos
{
    public record StockResponseDto(
        int Id,
        int ProduitId,
        string ProduitNom,
        string CodeBarre,
        int Quantite,
        string? ScannableCodebarre
    );
}