namespace Magasin.Api.Dtos;

public record ImageDataDto(
    byte[] Data,
    string ContentType
);
