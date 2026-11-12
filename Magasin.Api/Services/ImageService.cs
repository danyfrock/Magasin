using Magasin.Api.Database;
using Magasin.Api.Database.Entities;
using Magasin.Api.Dtos;
using Magasin.Api.Mappings;
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
            .FirstOrDefaultAsync(i => i.Id == id);
    }

    public async Task<List<ImageResponseDto>> GetAll()
    {
        var images = await GetAllEntity();

        return images
            .Select(i => i.ToDto())
            .ToList();
    }

    private async Task<List<Image>> GetAllEntity()
    {
        return await dbContext.Images
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

    public async Task<int> SupprimerImagesOrphelinesAsync()
    {
        var orphelines = await dbContext.Images
            .Where(img => !dbContext.Produits.Any(p => p.Image != null && p.Image.Id == img.Id))
            .ToListAsync();

        if (!orphelines.Any()) return 0;

        foreach (var image in orphelines)
        {
            try {File.Delete(image.Path);} catch(Exception){}
        }

        dbContext.Images.RemoveRange(orphelines);
        return await dbContext.SaveChangesAsync();
    }

    public async Task<int> FusionnerDoublonsImagesAsync()
    {
        List<Image> images = await GetAllEntity();
        if (images.Count <= 1) return 0;

        // 1. Calcul des hashs
        List<(Image Image, string Hash)> imagesAvecHash = new List<(Image Image, string Hash)>();
        foreach (Image image in images)
        {
            string? hash = await CalculerHashImageAsync(image);
            if (hash != null) imagesAvecHash.Add((image, hash));
        }

        // 2. Regroupement des doublons
        ILookup<string, Image> groupesDoublons = imagesAvecHash
            .ToLookup(x => x.Hash, x => x.Image);

        // 3. Association de chaque doublon à son image maîtresse
        Dictionary<int, int> mappingSubstitution = groupesDoublons
            .Where(groupe => groupe.Count() > 1)
            .SelectMany(groupe =>
            {
                IEnumerable<Image> imagesOrdonnees = groupe.OrderBy(image => image.Id);
                int idMaitre = imagesOrdonnees.First().Id;

                return imagesOrdonnees.Skip(1)
                    .Select(doublon => (Doublon: doublon, IdMaitresse: idMaitre));
            }).ToDictionary(
                relation => relation.Doublon.Id,
                relation => relation.IdMaitresse);

        if (mappingSubstitution.Count == 0)
            return await SupprimerImagesOrphelinesAsync();

        // 4. Réassignation des produits
        HashSet<int> idsDoublons = mappingSubstitution.Keys.ToHashSet();

        List<Produit> produitsConcernes = await dbContext.Produits
            .Include(produit => produit.Image)
            .Where(produit => produit.Image != null &&
                            idsDoublons.Contains(produit.Image.Id))
            .ToListAsync();

        produitsConcernes.ForEach(produit => 
            produit.Image = images.First(image => image.Id == mappingSubstitution[produit.Image!.Id]));

        // ici les anciens doublons sont orphelins, donc on peut les supprimer
        await dbContext.SaveChangesAsync();

        // Nettoyage global
        return await SupprimerImagesOrphelinesAsync();
    }

    private async Task<string?> CalculerHashImageAsync(Image image)
    {
        try
        {
            await using FileStream stream = File.OpenRead(image.Path);
            byte[] hashBytes = await System.Security.Cryptography.SHA256.HashDataAsync(stream);
            return Convert.ToHexString(hashBytes);
        }
        catch
        {
            return null;
        }
    }
    
}