using Magasin.Api.Database;
using Magasin.Api.Database.Entities;
using Magasin.Api.Dtos;
using Microsoft.EntityFrameworkCore;
using Magasin.Api.Mappings;

namespace Magasin.Api.Services;

public class ProduitService : ConteneurImageService<Produit>
{
    private readonly MagasinDbContext dbContext;
    private readonly StockService stockService;


    public ProduitService(MagasinDbContext dbContext, StockService stockService, ImageService imageService) : base(imageService)
    {
        this.dbContext = dbContext;
        this.stockService = stockService;
    }

public async Task<ProduitDto?> GetByCodeBarre(string codeBarre)
{
    Produit? produit = await dbContext.Produits
        .Include(p => p.Image)
        .FirstOrDefaultAsync(p => p.CodeBarre == codeBarre);

    return produit?.ToDto();
}

    public async Task<List<ProduitDto>> GetAll()
    {
        return await dbContext.Produits
            .Include(p => p.Image)
            .OrderBy(p => p.Nom)
            .Select(p => p.ToDto())
            .ToListAsync();
    }

    // CREATE : Crée le produit + son stock (quantité à 0)
    public async Task<ProduitDto> Create(ProduitLightDto produit)
    {
        Produit entity = produit.ToEntity();

        dbContext.Produits.Add(entity);
        await TraiterImage(entity, produit.Image);
        await dbContext.SaveChangesAsync(); // génère le CodeBarre

        // Création automatique du stock
        await stockService.Create(new StockDto(entity.CodeBarre, 1));

        return entity.ToDto();
    }

    public async Task<ProduitDto?> Update(ProduitDto produit)
    {
        Produit? entity = await dbContext.Produits
            .FindAsync(produit.Id);

        if (entity == null)
        {
            return null;
        }

        produit.UpdateProduit(ref entity);
        await TraiterImage(entity, produit.Image);

        await dbContext.SaveChangesAsync();

        return entity.ToDto();
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

    protected override void AssignerImage(Produit entity, Image? image)
    {
        entity.Image = image;
    }

}