using Magasin.Api.Database;
using Magasin.Api.Database.Entities;
using Magasin.Api.Dtos;
using Magasin.Api.Mappings;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Magasin.Api.Services
{
    public class JournalService
    {
        private readonly MagasinDbContext dbContext;
        private readonly IHttpContextAccessor httpContextAccessor;

        public JournalService(
            MagasinDbContext dbContext,
            IHttpContextAccessor httpContextAccessor)
        {
            this.dbContext = dbContext;
            this.httpContextAccessor = httpContextAccessor;
        }

    public async Task LogAsync(
        string action,                    // "Création", "Modification", "Suppression", "Vente"...
        string typeEntite,                // "Produit", "Stock", "Vente", "Utilisateur"...
        int? entiteId = null,
        string? anciennesValeurs = null,
        string? nouvellesValeurs = null)
    {
        ClaimsPrincipal? user = httpContextAccessor.HttpContext?.User;

        string? userIdClaim = user?.FindFirstValue(ClaimTypes.NameIdentifier);

        int? utilisateurId = int.TryParse(userIdClaim, out int id)
            ? id
            : null;

        Journal journal = new Journal
        {
            DateUtc = DateTime.UtcNow,
            UtilisateurId = utilisateurId,
            NomUtilisateur = user?.Identity?.Name,
            Action = action,
            TypeEntite = typeEntite,
            EntiteId = entiteId,
            AnciennesValeurs = anciennesValeurs,
            NouvellesValeurs = nouvellesValeurs,
            NomPoste = null
        };

        dbContext.JournalModifications.Add(journal);
        await dbContext.SaveChangesAsync();
    }

        public async Task<List<JournalDto>> GetAll(
            string? typeEntite = null,
            int? entiteId = null,
            int? limit = null)
        {
            IQueryable<Journal> query =
                dbContext.JournalModifications;

            if (!string.IsNullOrWhiteSpace(typeEntite))
            {
                query = query.Where(j =>
                    j.TypeEntite == typeEntite);
            }

            if (entiteId.HasValue)
            {
                query = query.Where(j =>
                    j.EntiteId == entiteId);
            }

            return await query
                .OrderByDescending(j => j.DateUtc)
                .Select(j => j.ToDto())
                .Take(limit?? 1000)
                .ToListAsync();
        }
    }
}