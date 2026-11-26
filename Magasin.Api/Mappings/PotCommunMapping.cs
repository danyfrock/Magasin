using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Magasin.Api.Database.Entities;
using Magasin.Api.Dtos;

namespace Magasin.Api.Mappings
{
    public static class PotCommunMapping
    {
        public static PotCommun ToEntity(this PotCommunCreateDto dto, int? venteId = null)
        {
            return new PotCommun
            {
                UtilisateurId = dto.UtilisateurId,
                Message = dto.Message,
                ProduitId = dto.ProduitId,
                DateCreation = DateTime.UtcNow,
                VenteId = venteId
            };
        }
        
        public static PotCommunResponseDto ToDto(this PotCommun entity)
        {
            return new PotCommunResponseDto(
                Id: entity.Id,
                Auteur: entity.Utilisateur?.Username ?? "Utilisateur inconnu",
                Message: entity.Message,
                ProduitId: entity.ProduitId,
                ProduitNom: entity.Produit?.Nom,
                VenteTotal: entity.Vente?.Total,
                DateCreation: entity.DateCreation,
                VenteId: entity.VenteId
            );
        }
    }
}