namespace Magasin.Api.Dtos
{
    public record ConvertResponseDto(
        string From,
        string To,
        decimal MontantOrigine,
        decimal MontantCible,
        int IdLot,
        decimal Rate
    );
}