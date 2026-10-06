using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Magasin.Api.Database.Entities
{
    public class Image
    {
        public int Id { get; set; }
        public required string Path { get; set; }
        public required string ContentType { get; set; }
    }
}