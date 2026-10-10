using Magasin.Api.Database.Entities;
using Magasin.Api.Database.Enums;
using Magasin.Api.Dtos;
using Microsoft.AspNetCore.Identity;

namespace Magasin.Api.Mappings;

public static class UserMapping
{
    public static UserResponseDto ToDto(this Utilisateur utilisateur)
    {
        return new UserResponseDto(
            Id: utilisateur.Id,
            Username: utilisateur.Username,
            Role: utilisateur.Role,
            DoitChangerMotDePasse: utilisateur.DoitChangerMotDePasse
        );
    }

    public static Utilisateur ToEntity(this CreateUserDto dto, PasswordHasher<Utilisateur> passwordHasher)
    {
        var utilisateur = new Utilisateur
        {
            Username = dto.Username,
            Role = string.IsNullOrEmpty(dto.Role) ? RoleEnum.Admin.ToString() : dto.Role,
            DoitChangerMotDePasse = true
        };

        utilisateur.PasswordHash = passwordHasher.HashPassword(utilisateur, dto.Password);
        return utilisateur;
    }
}