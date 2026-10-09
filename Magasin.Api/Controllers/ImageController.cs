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
        var images = await imageService.GetAll();

        return Ok(images);
    }
}