using Magasin.Api.Database.Entities;
using Magasin.Api.Dtos;
using ZXing;
using ZXing.Common;
using System.Drawing;
using System.Drawing.Imaging;
using ZXing.SkiaSharp;
using SkiaSharp;

namespace Magasin.Api.Mappings;

public static class ProduitMapping
{
    public static ProduitDto ToDto(this Produit produit)
    {
        return new ProduitDto(
            Id: produit.Id,
            produit.CodeBarre,
            produit.Nom,
            produit.Prix,
            produit.Description,
            new ImageSwitch(
                produit.Image?.ToDto(),
                null
            ),
            GenererCodeBarre(produit.CodeBarre)
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

    public static string? GenererCodeBarre(string codeBarre)
    {
        var writer = new BarcodeWriter
        {
            Format = BarcodeFormat.CODE_128,
            Options = new EncodingOptions
            {
                Height = 100,
                Width = 300,
                Margin = 2,
                PureBarcode = false
            }
        };

        using SKBitmap bitmap = writer.Write(codeBarre);
        using var image = SKImage.FromBitmap(bitmap);
        using var data = image.Encode(SKEncodedImageFormat.Png, 100);

        return Convert.ToBase64String(data.ToArray());
    }
}