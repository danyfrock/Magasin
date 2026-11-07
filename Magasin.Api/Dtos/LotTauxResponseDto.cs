using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Magasin.Api.Dtos
{
    public class LotTauxResponseDto
    {
        public int Id { get; set; }
        public DateTime UpdatedAt { get; set; }
        public string? Source { get; set; }
        public List<TauxChangeDto> Taux { get; set; } = new();
    }
}