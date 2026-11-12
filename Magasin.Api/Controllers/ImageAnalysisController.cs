using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Magasin.Api.Dtos;
using Magasin.Api.Services;

namespace Magasin.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ImageAnalysisController : ControllerBase
{
    private readonly ImageAnalysisService _imageAnalysisService;

    public ImageAnalysisController(ImageAnalysisService imageAnalysisService)
    {
        _imageAnalysisService = imageAnalysisService;
    }

    /// <summary>
    /// Analyse une image transmise via un ImageSwitch (données brutes ou fichier existant).
    /// </summary>
    [HttpPost("analyze")]
    public async Task<ActionResult<ImageAnalysisResultDto>> AnalyzeImage([FromBody] ImageSwitch imageSwitch)
    {
        if (imageSwitch == null)
        {
            return BadRequest(new { error = "Le payload ImageSwitch est requis." });
        }

        try
        {
            var result = await _imageAnalysisService.AnalyzeAsync(imageSwitch);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return UnprocessableEntity(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = $"Erreur interne lors de l'analyse de l'image : {ex.Message}" });
        }
    }
}