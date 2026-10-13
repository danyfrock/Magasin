namespace Magasin.Api.Dtos
{
    public record JournalDto(
        int Id,
        DateTime DateUtc,
        int? UtilisateurId,
        string? NomUtilisateur,
        string Action,
        string TypeEntite,
        int? EntiteId,
        string? AnciennesValeurs,
        string? NouvellesValeurs,
        string? NomPoste
    );
}