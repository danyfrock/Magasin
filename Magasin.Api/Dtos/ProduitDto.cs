using System;
using System.Drawing;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Magasin.Api.Dtos
{
    public record ProduitDto(int Id, string CodeBarre, string Nom, decimal Prix, string? Description, ImageSwitch Image, string? ScannableCodebarre);
}