using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Magasin.Api.Dtos
{
    public record PotCommunCreateDto(
        string Message,
        int? ProduitId,
        int? VenteId
    );
}