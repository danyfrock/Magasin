using Magasin.Api.Database;
using Magasin.Api.Database.Entities;
using Magasin.Api.Dtos;
using Magasin.Api.Mappings;
using Microsoft.EntityFrameworkCore;

namespace Magasin.Api.Services;

public class StockService
{
    private readonly MagasinDbContext dbContext;
    private readonly JournalService journalService;

    public StockService(
        MagasinDbContext dbContext,
        JournalService journalService)
    {
        this.dbContext = dbContext;
        this.journalService = journalService;
    }

    // GET : Récupère le stock d'un produit par son code-barres
    public async Task<StockResponseDto?> GetByCodeBarre(string codeBarre)
    {
        Stock? stock = await dbContext.Stocks
            .AsNoTracking()
            .Include(s => s.Produit)
            .Where(s => s.Produit.CodeBarre == codeBarre)
            .Where(s => !s.Produit.EstSupprime) // Exclut les produits supprimés
            .FirstOrDefaultAsync();

        if (stock is null) return null;

        // Génère le code-barres après la requête (SkiaSharp non traduisible en SQL)
        return stock.ToDto();
    }

    // GET : Récupère tous les stocks (triés par nom de produit)
    public async Task<List<StockResponseDto>> GetAll()
    {
        var stocks = await dbContext.Stocks
            .AsNoTracking()
            .Include(s => s.Produit)
            .Where(s => !s.Produit.EstSupprime) // Exclut les produits supprimés
            .OrderBy(s => s.Produit.Nom)
            .ToListAsync();

        // Génère les codes-barres après la requête
        return stocks.Select(s => s.ToDto()).ToList();
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

        Stock stock = dto.ToEntity(produit);

        dbContext.Stocks.Add(stock);
        await dbContext.SaveChangesAsync();

        await journalService.LogAsync(
            action: "Création",
            typeEntite: "Stock",
            entiteId: stock.Id,
            nouvellesValeurs:
                $"Produit : {produit.Nom}, Quantité : {stock.Quantite}");

        return stock.ToDto();
    }

    // UPDATE : Modifie uniquement la quantité d'un stock existant
    public async Task<StockResponseDto?> Update(StockDto dto)
    {
        var stock = await dbContext.Stocks
            .Include(s => s.Produit)
            .FirstOrDefaultAsync(s => s.Produit.CodeBarre == dto.CodeBarre);

        if (stock is null)
            return null; // Stock introuvable

        string anciennesValeurs =
            $"Produit : {stock.Produit.Nom}, Quantité : {stock.Quantite}, supprimé : {(stock.Produit.EstSupprime?"Oui":"Non").ToString()}";

        stock.Quantite = dto.Quantite;

        await dbContext.SaveChangesAsync();

        await journalService.LogAsync(
            action: "Modification",
            typeEntite: "Stock",
            entiteId: stock.Id,
            anciennesValeurs: anciennesValeurs,
            nouvellesValeurs:
                $"Produit : {stock.Produit.Nom}, Quantité : {stock.Quantite}, supprimé : {(stock.Produit.EstSupprime?"Oui":"Non").ToString()}");

        return stock.ToDto();
    }
}