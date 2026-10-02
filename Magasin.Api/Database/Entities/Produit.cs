using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Magasin.Api.Database.Entities;

public class Produit
{
    public int Id { get; set; }
    public string CodeBarre { get; set; } = null!;
    public required string Nom { get; set; }
    public int Prix { get; set; }
}