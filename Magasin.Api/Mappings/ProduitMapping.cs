using Magasin.Api.Database.Entities;
using Magasin.Api.Dtos;

namespace Magasin.Api.Mappings;

public static class ProduitMapping
{
    public static ProduitDto ToDto(this Produit produit)
    {
        return new ProduitDto(
            produit.Id,
            produit.CodeBarre,
            produit.Nom,
            produit.Prix,
            produit.Description,
            new ImageSwitch(
                produit.Image?.ToDto(),
                null
            )
        );
    }

    public static ProduitLightDto ToLightDto(this Produit produit)
    {
        return new ProduitLightDto(
            produit.Nom,
            produit.Prix,
            produit.Description,
            new ImageSwitch(
                produit.Image?.ToDto(),
                null
            )
        );
    }

    public static void UpdateProduit(
        this ProduitDto dto,
        ref Produit produit)
    {
        produit.CodeBarre = dto.CodeBarre;
        produit.Nom = dto.Nom;
        produit.Prix = dto.Prix;
        produit.Description = dto.Description;
    }

    public static Produit ToEntity(this ProduitLightDto dto)
    {
        return new Produit
        {
            Nom = dto.Nom,
            Prix = dto.Prix,
            Description = dto.Description
        };
    }
}