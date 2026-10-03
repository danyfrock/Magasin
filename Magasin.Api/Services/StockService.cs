using Magasin.Api.Database;
using Magasin.Api.Database.Entities;
using Magasin.Api.Dtos;
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
        return await dbContext.Stocks
            .AsNoTracking()
            .Where(s => s.Produit.CodeBarre == codeBarre)
            .Select(s => new StockResponseDto(
                s.Id,
                s.IdProduit,
                s.Produit.Nom,
                s.Produit.CodeBarre,
                s.Quantite
            ))
            .FirstOrDefaultAsync();
    }

    // GET : Récupère tous les stocks (triés par nom de produit)
    public async Task<List<StockResponseDto>> GetAll()
    {
        return await dbContext.Stocks
            .AsNoTracking()
            .OrderBy(s => s.Produit.Nom)
            .Select(s => new StockResponseDto(
                s.Id,
                s.IdProduit,
                s.Produit.Nom,
                s.Produit.CodeBarre,
                s.Quantite
            ))
            .ToListAsync();
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
            stock.Quantite
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
            stock.Quantite
        );
    }
}