using Magasin.Api.Database;
using Magasin.Api.Database.Entities;
using Magasin.Api.Dtos;
using Magasin.Api.Mappings;
using Microsoft.EntityFrameworkCore;

namespace Magasin.Api.Services;

public class VenteService
{
    private readonly MagasinDbContext dbContext;

    public VenteService(MagasinDbContext dbContext)
    {
        this.dbContext = dbContext;
    }

    public async Task<VenteResponseDto?> GetById(int id)
    {
        var vente = await dbContext.Ventes
            .Include(v => v.Lignes)
                .ThenInclude(l => l.Produit)
            .Include(v => v.Paiements)
            .FirstOrDefaultAsync(v => v.Id == id);

        return vente?.ToResponseDto();
    }

    public async Task<List<VenteResponseDto>> GetAll()
    {
        return await dbContext.Ventes
            .Include(v => v.Lignes)
                .ThenInclude(l => l.Produit)
            .Include(v => v.Paiements)
            .OrderByDescending(v => v.Date)
            .Select(v => v.ToResponseDto())
            .ToListAsync();
    }

    public async Task<VenteResponseDto?> Create(VenteDto dto)
    {
        Vente? vente = await CreerVente(dto);

        if (vente == null)
        {
            return null;
        }

        dbContext.Ventes.Add(vente);
        await dbContext.SaveChangesAsync();

        return vente.ToResponseDto();
    }

    public async Task<VenteResponseDto?> Update(int id, VenteDto dto)
    {
        Vente? vente = await dbContext.Ventes
            .Include(v => v.Lignes)
            .Include(v => v.Paiements)
            .FirstOrDefaultAsync(v => v.Id == id);

        if (vente == null)
        {
            return null;
        }

        Vente? nouvelleVente = await CreerVente(dto);

        if (nouvelleVente == null)
        {
            return null;
        }

        vente.Date = nouvelleVente.Date;
        vente.Total = nouvelleVente.Total;

        vente.Lignes.Clear();
        vente.Paiements.Clear();

        foreach (LigneVente ligne in nouvelleVente.Lignes)
        {
            vente.Lignes.Add(ligne);
        }

        foreach (LignePaiement paiement in nouvelleVente.Paiements)
        {
            vente.Paiements.Add(paiement);
        }

        await dbContext.SaveChangesAsync();

        return vente.ToResponseDto();
    }

    public async Task<bool> Delete(int id)
    {
        Vente? vente = await dbContext.Ventes
            .FindAsync(id);

        if (vente == null)
        {
            return false;
        }

        dbContext.Ventes.Remove(vente);
        await dbContext.SaveChangesAsync();

        return true;
    }

    private async Task<Vente?> CreerVente(VenteDto dto)
    {
        // Validation
        if (!dto.Lignes.Any())
        {
            return null;
        }

        // Produits
        List<Produit> produits = await dbContext.Produits
            .Where(p => dto.Lignes.Select(l => l.ProduitId).Contains(p.Id))
            .ToListAsync();

        if (produits.Count != dto.Lignes.Count)
        {
            return null;
        }

        // Lignes de vente
        Vente vente = new Vente
        {
            Date = DateTime.UtcNow,
            Lignes = dto.Lignes.Select(l =>
            {
                Produit produit = produits.First(p => p.Id == l.ProduitId);

                return new LigneVente
                {
                    ProduitId = produit.Id,
                    Quantite = l.Quantite,
                    PrixUnitaire = produit.Prix
                };
            }).ToList()
        };

        if (vente.Lignes.Any(l => l.Quantite <= 0))
        {
            return null;
        }

        vente.Total = vente.Lignes.Sum(l => l.Quantite * l.PrixUnitaire);

        // Paiements
        int totalPaye = dto.Paiements.Sum(p => p.Montant);
        int rendu = totalPaye - vente.Total;

        if (dto.Paiements.Any(p => p.Montant <= 0) || rendu < 0 || dto.Rendu != rendu)
        {
            return null;
        }

        vente.Paiements = dto.Paiements
            .Select(p => new LignePaiement
            {
                Type = "paiement",
                MoyenPaiement = p.MoyenPaiement,
                Montant = p.Montant
            })
            .ToList();

        // Rendu
        if (dto.Rendu > 0)
        {
            vente.Paiements.Add(new LignePaiement
            {
                Type = "rendu",
                MoyenPaiement = "especes",
                Montant = -dto.Rendu
            });
        }

        return vente;
    }

}