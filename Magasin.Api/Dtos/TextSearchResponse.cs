using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Magasin.Api.Dtos
{
    public sealed class TextSearchResponse
    {
        public List<TextSearchResult> Results { get; set; } = [];
}
}