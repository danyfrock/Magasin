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
    private readonly JournalService journalService;
    private readonly TextSearchService textSearchService;

    public ProduitService(
            MagasinDbContext dbContext,
            StockService stockService,
            ImageService imageService,
            JournalService journalService,
            TextSearchService textSearchService) : base(imageService)
    {
        this.dbContext = dbContext;
        this.stockService = stockService;
        this.journalService = journalService;
        this.textSearchService = textSearchService;
    }

    public async Task<ProduitDto?> GetByCodeBarre(string codeBarre)
    {
        Produit? produit = await dbContext.Produits
            .AsNoTracking()
            .Include(p => p.Image)
            .FirstOrDefaultAsync(p => p.CodeBarre == codeBarre);

        return produit?.ToDto();
    }

    public async Task<List<ProduitDto>> GetByText(string? texte)
    {
        if(string.IsNullOrWhiteSpace(texte)) return []; // Texte vide, retourne une liste vide

        return await dbContext.Produits
            .AsNoTracking()
            .Include(p => p.Image)
            .Where(p =>
                p.Nom.Contains(texte) ||
                (p.Description != null && p.Description.Contains(texte)))
            .OrderByDescending(p => p.Nom.Contains(texte))
            .ThenBy(p => p.Nom)
            .Select(p => p.ToDto())
            .ToListAsync();
    }

    public async Task<List<ProduitDto>> GetAll()
    {
        return await dbContext.Produits
            .AsNoTracking()
            .Include(p => p.Image)
            .OrderBy(p => p.Nom)
            .Select(p => p.ToDto())
            .ToListAsync();
    }

    public async Task<List<ProduitDto>> SmartSearch(string? texte, string texteIntelligent, int topN = 20)
    {
        // Préselectionne les produits à partir de la base de données
        List<ProduitDto> preselection = await GetByText(texte);

        // Effectue la recherche intelligente sur la préselection
        return await SmartSearch(texteIntelligent, preselection, topN);
    }

    private async Task<List<ProduitDto>> SmartSearch(string texte, List<ProduitDto> preselection, int topN = 20)
    {
        // check
        if (string.IsNullOrWhiteSpace(texte)) return []; // Texte vide, retourne une liste vide

        if (!preselection.Any())
        {
            preselection = await GetAll(); // Si aucune préselection, récupère tous les produits
        }

        // Prépare
        List<TextSearchCandidate> candidates = preselection
            .Select(p => new TextSearchCandidate(
                p.CodeBarre,
                string.IsNullOrWhiteSpace(p.Description)
                    ? p.Nom
                    : $"{p.Nom} : {p.Description}"))
            .ToList();

        // recherche intelligente
        TextSearchResponse reponse = await textSearchService.SearchAsync(
            texte.Trim(),
            candidates,
            topN);
            List<TextSearchResult> elus = reponse.Results;
        if (elus.Count == 0) return []; // Aucun produit trouvé

        // Récupère les produits correspondants aux résultats du moteur de recherche
        List<string> codesElus = elus
            .Select(e => e.Id)
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .Distinct()
            .ToList();
        Dictionary<string, Produit> produitsAvecImage = (await dbContext.Produits
                .AsNoTracking()
                .Include(p => p.Image)
                .Where(p => codesElus.Contains(p.CodeBarre))
                .ToListAsync())
            .ToDictionary(p => p.CodeBarre);

        // Construit la liste finale des produits à retourner, en respectant l'ordre des résultats du moteur de recherche
        List<ProduitDto> resultats = [];
        foreach (TextSearchResult lu in elus.OrderByDescending(e => e.Score))
        {
            if (produitsAvecImage.TryGetValue(lu.Id, out Produit? produit))
            {
                resultats.Add(produit.ToDto());
            }
        }

        // Retourne la liste des produits trouvés
        return resultats;
    }

    // CREATE : Crée le produit + son stock (quantité à 0)
    public async Task<ProduitDto> Create(ProduitLightDto produit)
    {
        Produit entity = produit.ToEntity();

        await TraiterImage(entity, produit.Image);
        dbContext.Produits.Add(entity);
        await dbContext.SaveChangesAsync(); // génère le CodeBarre

        await journalService.LogAsync(
            action: "Création",
            typeEntite: "Produit",
            entiteId: entity.Id,
            nouvellesValeurs: $"Code-barres : {entity.CodeBarre}, Nom : {entity.Nom}, Prix : {entity.Prix}");

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

        string anciennesValeurs = $"Code-barres : {entity.CodeBarre}, Nom : {entity.Nom}, Prix : {entity.Prix}";
        await TraiterImage(entity, produit.Image);
        produit.UpdateProduit(ref entity);

        await dbContext.SaveChangesAsync();
        await journalService.LogAsync(
            "Modification",
            "Produit",
            entity.Id,
            anciennesValeurs,
            $"Code-barres : {entity.CodeBarre}, Nom : {entity.Nom}, Prix : {entity.Prix}");

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

        string anciennesValeurs = $"Code-barres : {entity.CodeBarre}, Nom : {entity.Nom}, Prix : {entity.Prix}";
        dbContext.Produits.Remove(entity);
        await dbContext.SaveChangesAsync(); // Cascade → supprime aussi le Stock

        await journalService.LogAsync(
            "Suppression",
            "Produit",
            entity.Id,
            anciennesValeurs);

        return true;
    }

    protected override void AssignerImage(Produit entity, Image? image)
    {
        entity.Image = image;
    }

}