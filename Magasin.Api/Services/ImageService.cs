using Magasin.Api.Database;
using Magasin.Api.Database.Entities;
using Magasin.Api.Dtos;
using Microsoft.EntityFrameworkCore;

namespace Magasin.Api.Services;

public class ImageService
{
    private readonly MagasinDbContext dbContext;

    public ImageService(MagasinDbContext dbContext)
    {
        this.dbContext = dbContext;
    }

    public async Task<Image?> GetById(int id)
    {
        return await dbContext.Images
            .AsNoTracking()
            .FirstOrDefaultAsync(i => i.Id == id);
    }

    public async Task<List<Image>> GetAll()
    {
        return await dbContext.Images
            .AsNoTracking()
            .OrderBy(i => i.Id)
            .ToListAsync();
    }

    public async Task<Image> Create(ImageDataDto dto)
    {
        string extension = dto.ContentType switch
        {
            "image/jpeg" => ".jpg",
            "image/png" => ".png",
            "image/webp" => ".webp",
            "image/gif" => ".gif",
            _ => throw new ArgumentException("Type d'image non supporté.")
        };

        var fileName = $"{Guid.NewGuid()}{extension}";
        
        var directory = Path.Combine(".", "Images");
        Directory.CreateDirectory(directory);

        var filePath = Path.Combine(directory, fileName);

        await File.WriteAllBytesAsync(filePath, dto.Data);

        var image = new Image
        {
            Path = filePath,
            ContentType = dto.ContentType
        };

        dbContext.Images.Add(image);
        await dbContext.SaveChangesAsync();

        return image;
    }

    public async Task<bool> Delete(int id)
    {
        var image = await dbContext.Images
            .FirstOrDefaultAsync(i => i.Id == id);

        if (image is null)
            return false;

        if (File.Exists(image.Path))
        {
            File.Delete(image.Path);
        }

        dbContext.Images.Remove(image);
        await dbContext.SaveChangesAsync();

        return true;
    }
}