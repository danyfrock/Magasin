using Magasin.Api.Database.Entities;
using Magasin.Api.Dtos;

namespace Magasin.Api.Services;

public abstract class ConteneurImageService<TEntity>
    where TEntity : class
{
    protected readonly ImageService ImageService;

    protected ConteneurImageService(ImageService imageService)
    {
        ImageService = imageService;
    }

    public async Task TraiterImage(TEntity entity, ImageSwitch image)
    {
        Image? imageEntity = null;

        if (image.ImageResponse is not null)
        {
            imageEntity = await ImageService.GetById(image.ImageResponse.Id);
        }
        else if (image.ImageData is not null)
        {
            imageEntity = await ImageService.Create(image.ImageData);
        }

        AssignerImage(entity, imageEntity);
    }

    protected abstract void AssignerImage(TEntity entity, Image? image);
}
