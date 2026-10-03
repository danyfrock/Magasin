using Magasin.Api.Database;
using Magasin.Api.Database.Entities;
using Magasin.Api.Dtos;
using Microsoft.EntityFrameworkCore;

namespace Magasin.Api.Services;

public class ProduitService
{
    private readonly MagasinDbContext dbContext;
    private readonly StockService stockService;

    public ProduitService(MagasinDbContext dbContext, StockService stockService)
    {
        this.dbContext = dbContext;
        this.stockService = stockService;
    }

    public async Task<Produit?> GetByCodeBarre(string codeBarre)
    {
        return await dbContext.Produits
            .FirstOrDefaultAsync(p => p.CodeBarre == codeBarre);
    }

    public async Task<List<Produit>> GetAll()
    {
        return await dbContext.Produits
            .OrderBy(p => p.Nom)
            .ToListAsync();
    }

    // CREATE : Crée le produit + son stock (quantité à 0)
    public async Task<Produit> Create(ProduitLightDto produit)
    {
        Produit entity = new Produit
        {
            Nom = produit.Nom,
            Prix = produit.Prix
        };

        dbContext.Produits.Add(entity);
        await dbContext.SaveChangesAsync(); // génère le CodeBarre

        // Création automatique du stock
        await stockService.Create(new StockDto(entity.CodeBarre, 1));

        return entity;
    }

    public async Task<Produit?> Update(ProduitDto produit)
    {
        Produit? entity = await dbContext.Produits
            .FindAsync(produit.Id);

        if (entity == null)
        {
            return null;
        }

        entity.CodeBarre = produit.CodeBarre;
        entity.Nom = produit.Nom;
        entity.Prix = produit.Prix;

        await dbContext.SaveChangesAsync();

        return entity;
    }

    // DELETE : Supprime le produit (le stock est supprimé automatiquement grâce au Cascade)
    public async Task<bool> Delete(int id)
    {
        Produit? entity = await dbContext.Produits
            .FindAsync(id);

        if (entity == null)
        {
            return false;
        }

        dbContext.Produits.Remove(entity);
        await dbContext.SaveChangesAsync(); // Cascade → supprime aussi le Stock

        return true;
    }
}