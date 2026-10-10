using Magasin.Api.Database;
using Magasin.Api.Database.Entities;
using Magasin.Api.Dtos;
using Magasin.Api.Mappings;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Magasin.Api.Services;

public class UserService
{
    private readonly MagasinDbContext dbContext;
    private readonly PasswordHasher<Utilisateur> passwordHasher = new();

    public UserService(MagasinDbContext dbContext)
    {
        this.dbContext = dbContext;
    }

    public async Task<List<UserResponseDto>> GetAllAsync()
    {
        var utilisateurs = await dbContext.Utilisateurs.ToListAsync();
        return utilisateurs.Select(u => u.ToDto()).ToList();
    }

    public async Task<UserResponseDto?> CreateAsync(CreateUserDto dto)
    {
        if (await dbContext.Utilisateurs.AnyAsync(u => u.Username == dto.Username))
        {
            return null; 
        }

        var utilisateur = dto.ToEntity(passwordHasher);

        dbContext.Utilisateurs.Add(utilisateur);
        await dbContext.SaveChangesAsync();

        return utilisateur.ToDto();
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var utilisateur = await dbContext.Utilisateurs.FindAsync(id);
        if (utilisateur == null) return false;

        dbContext.Utilisateurs.Remove(utilisateur);
        await dbContext.SaveChangesAsync();
        return true;
    }
}