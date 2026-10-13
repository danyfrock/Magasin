using Magasin.Api.Database.Entities;
using Magasin.Api.Dtos;

namespace Magasin.Api.Mappings;

public static class VenteMapping
{
    public static VenteResponseDto ToResponseDto(this Vente vente)
    {
        return new VenteResponseDto(
            vente.Id,
            vente.Date,
            vente.Total,
            vente.Lignes.Select(l => new LigneVenteResponseDto(
                l.Id,
                l.ProduitId,
                l.Produit?.Nom ?? $"Produit #{l.ProduitId}",
                l.Quantite,
                l.PrixUnitaire
            )).ToList(),
            vente.Paiements.Select(p => new LignePaiementResponseDto(
                p.Id,
                p.Type,
                p.MoyenPaiement,
                p.Montant
            )).ToList()
        );
    }

    public static Vente ToEntity(this VenteDto dto, List<Produit> produits)
    {
        Vente vente = new()
        {
            Date = DateTime.UtcNow,
            Lignes = dto.Lignes.Select(l => l.ToEntity(produits)).ToList(),
            Paiements = dto.Paiements.Select(p => p.ToEntity()).ToList()
        };

        vente.Total = vente.Lignes.Sum(l => l.Quantite * l.PrixUnitaire);


        if (dto.Rendu != 0)
        {
            vente.Paiements.Add(CreerRendu(dto.Rendu));
        }

        return vente;
    }

    private static LigneVente ToEntity(
        this LigneVenteDto ligne,
        List<Produit> produits)
    {
        Produit produit = produits.First(p => p.Id == ligne.ProduitId);
        return ligne.ToEntity(produit);
    }

    private static LigneVente ToEntity(
        this LigneVenteDto ligne,
        Produit produit)
    {
        return new LigneVente
        {
            ProduitId = produit.Id,
            Quantite = ligne.Quantite,
            PrixUnitaire = produit.Prix
        };
    }

    private static LignePaiement ToEntity(
        this LignePaiementDto dto)
    {
        return new LignePaiement
        {
            Type = "paiement",
            MoyenPaiement = dto.MoyenPaiement,
            Montant = dto.Montant
        };
    }

    private static LignePaiement CreerRendu(int montant)
    {
        return new LignePaiement
        {
            Type = "rendu",
            MoyenPaiement = "especes",
            Montant = -montant
        };
    }
}