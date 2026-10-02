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
}