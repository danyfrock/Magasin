using Magasin.Api.Dtos;
using Magasin.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Magasin.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/tauxchange")]
public class TauxChangeController : ControllerBase
{
    private readonly TauxChangeService tauxChangeService;

    public TauxChangeController(TauxChangeService tauxChangeService)
    {
        this.tauxChangeService = tauxChangeService;
    }

    // GET : /api/tauxchange/{id} -> Un taux spécifique par son Id (traçabilité)
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var taux = await tauxChangeService.GetByIdAsync(id);
        if (taux == null)
        {
            return NotFound();
        }
        return Ok(taux);
    }

    // GET : /api/tauxchange/lots -> Historique des lots
    [HttpGet("all")]
    public async Task<IActionResult> GetAll()
    {
        var lots = await tauxChangeService.GetAllLotsAsync();
        return Ok(lots);
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var lot = await tauxChangeService.GetOrRefreshAsync();
        if (lot == null)
        {
            return StatusCode(503, "Impossible de récupérer les taux depuis le service distant.");
        }
        return Ok(lot);
    }
}