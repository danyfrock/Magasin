using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Magasin.Api.Dtos
{
      public sealed record TextSearchResult(string Id, double Score);
}