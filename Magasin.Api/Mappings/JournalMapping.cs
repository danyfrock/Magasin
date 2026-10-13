using Magasin.Api.Database.Entities;
using Magasin.Api.Dtos;

namespace Magasin.Api.Mappings
{
    public static class JournalMapping
    {
        public static JournalDto ToDto(this Journal entity)
        {
            return new JournalDto(
                entity.Id,
                entity.DateUtc,
                entity.UtilisateurId,
                entity.NomUtilisateur,
                entity.Action,
                entity.TypeEntite,
                entity.EntiteId,
                entity.AnciennesValeurs,
                entity.NouvellesValeurs,
                entity.NomPoste
            );
        }

        public static Journal ToEntity(this JournalDto dto)
        {
            return new Journal
            {
                Id = dto.Id,
                DateUtc = dto.DateUtc,
                UtilisateurId = dto.UtilisateurId,
                NomUtilisateur = dto.NomUtilisateur,
                Action = dto.Action,
                TypeEntite = dto.TypeEntite,
                EntiteId = dto.EntiteId,
                AnciennesValeurs = dto.AnciennesValeurs,
                NouvellesValeurs = dto.NouvellesValeurs,
                NomPoste = dto.NomPoste,
            };
        }
    }
}