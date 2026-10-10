using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Magasin.Api.Dtos
{
    public record CreateUserDto(
        string Username,
        string Password,
        string Role
    );
}