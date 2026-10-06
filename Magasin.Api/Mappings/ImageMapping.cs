using Magasin.Api.Database.Entities;
using Magasin.Api.Dtos;

namespace Magasin.Api.Mappings;

public static class ImageMapping
{
    public static ImageResponseDto ToDto(this Image image)
    {
        return new ImageResponseDto(
            image.Id,
            image.Path,
            image.ContentType
        );
    }

    public static Image ToEntity(this ImageResponseDto dto)
    {
        return new Image
        {
            Id = dto.Id,
            Path = dto.ImagePath,
            ContentType = dto.ContentType
        };
    }
}