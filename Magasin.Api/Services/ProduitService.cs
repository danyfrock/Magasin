using Magasin.Api.Database;
using Magasin.Api.Database.Entities;
using Microsoft.EntityFrameworkCore;
using Magasin.Api.Dtos;

namespace Magasin.Api.Services;

public class ProduitService
{
    private readonly MagasinDbContext dbContext;

    public ProduitService(MagasinDbContext dbContext)
    {
        this.dbContext = dbContext;
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

    public async Task<Produit> Create(ProduitLightDto produit)
    {
        Produit entity = new Produit
        {
            Nom = produit.Nom,
            Prix = produit.Prix
        };

        dbContext.Produits.Add(entity);
        await dbContext.SaveChangesAsync();

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

    public async Task<bool> Delete(int id)
    {
        Produit? entity = await dbContext.Produits
            .FindAsync(id);

        if (entity == null)
        {
            return false;
        }

        dbContext.Produits.Remove(entity);
        await dbContext.SaveChangesAsync();

        return true;
    }
}