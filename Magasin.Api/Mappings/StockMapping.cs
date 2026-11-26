using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Magasin.Api.Database.Entities;
using Magasin.Api.Dtos;

namespace Magasin.Api.Mappings
{
    public static class StockMapping
    {
        public static StockResponseDto ToDto(this Stock stock)
        {
            return new StockResponseDto(
                Id: stock.Id,
                ProduitId: stock.IdProduit,
                ProduitNom: stock.Produit.Nom,
                CodeBarre: stock.Produit.CodeBarre,
                Quantite: stock.Quantite,
                ScannableCodebarre: ProduitMapping.GenererCodeBarre(stock.Produit.CodeBarre)
            );
        }

        public static Stock ToEntity(
            this StockDto dto,
            Produit produit)
        {
            return new Stock
            {
                IdProduit = produit.Id,
                Produit = produit,
                Quantite = dto.Quantite
            };
        }
    }

}