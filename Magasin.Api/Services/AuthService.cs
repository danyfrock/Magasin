using Magasin.Api.Database;
using Magasin.Api.Database.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Magasin.Api.Services;

public class AuthService
{
    private readonly MagasinDbContext dbContext;
    private readonly PasswordHasher<Utilisateur> passwordHasher = new();

    public AuthService(MagasinDbContext dbContext)
    {
        this.dbContext = dbContext;
    }

    /// <summary>
    /// Authentifie un utilisateur en vérifiant son nom d'utilisateur et son mot de passe haché.
    /// </summary>
    public async Task<Utilisateur?> AuthentifierAsync(string username, string password)
    {
        var utilisateur = await dbContext.Utilisateurs
            .FirstOrDefaultAsync(u => u.Username == username);

        if (utilisateur == null)
        {
            return null;
        }

        var result = passwordHasher.VerifyHashedPassword(utilisateur, utilisateur.PasswordHash, password);

        return result == PasswordVerificationResult.Success ? utilisateur : null;
    }

    /// <summary>
    /// Met à jour le mot de passe d'un utilisateur et désactive l'obligation de changement.
    /// </summary>
    public async Task<bool> ChangerMotDePasseAsync(int utilisateurId, string nouveauMotDePasse)
    {
        var utilisateur = await dbContext.Utilisateurs.FindAsync(utilisateurId);
        
        if (utilisateur == null)
        {
            return false;
        }

        utilisateur.PasswordHash = passwordHasher.HashPassword(utilisateur, nouveauMotDePasse);
        utilisateur.DoitChangerMotDePasse = false;

        await dbContext.SaveChangesAsync();
        return true;
    }

    /// <summary>
    /// Crée un administrateur par défaut au premier lancement si aucun utilisateur n'existe.
    /// </summary>
    public async Task InitialiserAdminParDefautAsync()
    {
        if (!await dbContext.Utilisateurs.AnyAsync())
        {
            var admin = new Utilisateur
            {
                Username = "admin",
                Role = "Admin",
                DoitChangerMotDePasse = true
            };

            // Mot de passe temporaire par défaut : Admin123!
            admin.PasswordHash = passwordHasher.HashPassword(admin, "Admin123!");

            dbContext.Utilisateurs.Add(admin);
            await dbContext.SaveChangesAsync();
        }
    }
}