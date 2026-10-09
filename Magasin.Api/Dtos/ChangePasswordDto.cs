using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Magasin.Api.Dtos
{
    public record ChangePasswordDto(string OldPassword, string NewPassword);
}