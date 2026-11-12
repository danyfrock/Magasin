using Magasin.Api.Dtos;
using Magasin.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Magasin.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ImageController : ControllerBase
{
    private readonly ImageService imageService;

    public ImageController(ImageService imageService)
    {
        this.imageService = imageService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        List<ImageResponseDto> images = await imageService.GetAll();

        return Ok(images);
    }

    [HttpPost("cleanup-orphans")]
    public async Task<IActionResult> CleanupOrphans()
    {
        int nombreSupprimees = await imageService.SupprimerImagesOrphelinesAsync();

        return Ok(new { Supprimees = nombreSupprimees });
    }

    [HttpPost("merge-duplicates")]
    public async Task<IActionResult> MergeDuplicates()
    {
        int nombreFusionnees = await imageService.FusionnerDoublonsImagesAsync();

        return Ok(new { Fusionnees = nombreFusionnees });
    }
}