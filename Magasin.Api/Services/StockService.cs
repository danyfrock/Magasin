using Magasin.Api.Database;
using Magasin.Api.Database.Entities;
using Magasin.Api.Dtos;
using Magasin.Api.Mappings;
using Microsoft.EntityFrameworkCore;

namespace Magasin.Api.Services;

public class StockService
{
    private readonly MagasinDbContext dbContext;

    public StockService(MagasinDbContext dbContext)
    {
        this.dbContext = dbContext;
    }

    // GET : Récupère le stock d'un produit par son code-barres
    public async Task<StockResponseDto?> GetByCodeBarre(string codeBarre)
    {
        var stock = await dbContext.Stocks
            .AsNoTracking()
            .Where(s => s.Produit.CodeBarre == codeBarre)
            .Select(s => new
            {
                s.Id,
                s.IdProduit,
                ProduitNom = s.Produit.Nom,
                CodeBarre = s.Produit.CodeBarre,
                s.Quantite
            })
            .FirstOrDefaultAsync();

        if (stock is null)
            return null;

        // Génère le code-barres après la requête (SkiaSharp non traduisible en SQL)
        return new StockResponseDto(
            stock.Id,
            stock.IdProduit,
            stock.ProduitNom,
            stock.CodeBarre,
            stock.Quantite,
            ProduitMapping.GenererCodeBarre(stock.CodeBarre)
        );
    }

    // GET : Récupère tous les stocks (triés par nom de produit)
    public async Task<List<StockResponseDto>> GetAll()
    {
        var stocks = await dbContext.Stocks
            .AsNoTracking()
            .OrderBy(s => s.Produit.Nom)
            .Select(s => new
            {
                s.Id,
                s.IdProduit,
                ProduitNom = s.Produit.Nom,
                CodeBarre = s.Produit.CodeBarre,
                s.Quantite
            })
            .ToListAsync();

        // Génère les codes-barres après la requête
        return stocks.Select(s => new StockResponseDto(
            s.Id,
            s.IdProduit,
            s.ProduitNom,
            s.CodeBarre,
            s.Quantite,
            ProduitMapping.GenererCodeBarre(s.CodeBarre)
        )).ToList();
    }

    // CREATE : Crée un stock pour un produit qui n'en a pas encore
    public async Task<StockResponseDto?> Create(StockDto dto)
    {
        var produit = await dbContext.Produits
            .FirstOrDefaultAsync(p => p.CodeBarre == dto.CodeBarre);

        if (produit is null)
            return null; // Produit introuvable

        bool stockExiste = await dbContext.Stocks
            .AnyAsync(s => s.IdProduit == produit.Id);

        if (stockExiste)
            return null; // Un stock existe déjà pour ce produit

        var stock = new Stock
        {
            IdProduit = produit.Id,
            Quantite = dto.Quantite,
            Produit = produit          // obligatoire à cause du "required"
        };

        dbContext.Stocks.Add(stock);
        await dbContext.SaveChangesAsync();

        return new StockResponseDto(
            stock.Id,
            stock.IdProduit,
            produit.Nom,
            produit.CodeBarre,
            stock.Quantite,
            ProduitMapping.GenererCodeBarre(produit.CodeBarre)
        );
    }

    // UPDATE : Modifie uniquement la quantité d'un stock existant
    public async Task<StockResponseDto?> Update(StockDto dto)
    {
        var stock = await dbContext.Stocks
            .Include(s => s.Produit)
            .FirstOrDefaultAsync(s => s.Produit.CodeBarre == dto.CodeBarre);

        if (stock is null)
            return null; // Stock introuvable

        stock.Quantite = dto.Quantite;
        await dbContext.SaveChangesAsync();

        return new StockResponseDto(
            stock.Id,
            stock.IdProduit,
            stock.Produit.Nom,
            stock.Produit.CodeBarre,
            stock.Quantite,
            ProduitMapping.GenererCodeBarre(stock.Produit.CodeBarre)
        );
    }
}