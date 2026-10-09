using Magasin.Api.Database.Entities;
using Magasin.Api.Dtos;
using Magasin.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Magasin.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/ventes")]
public class VenteController : ControllerBase
{
    private readonly VenteService venteService;

    public VenteController(VenteService venteService)
    {
        this.venteService = venteService;
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        VenteResponseDto? vente = await venteService.GetById(id);

        if (vente == null)
        {
            return NotFound();
        }

        return Ok(vente);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        List<VenteResponseDto> ventes = await venteService.GetAll();

        return Ok(ventes);
    }

    [HttpPost]
    public async Task<IActionResult> Create(VenteDto vente)
    {
        VenteResponseDto? created = await venteService.Create(vente);

        if (created == null)
        {
            return BadRequest();
        }

        return Ok(created);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, VenteDto vente)
    {
        VenteResponseDto? updated = await venteService.Update(id, vente);

        if (updated == null)
        {
            return BadRequest();
        }

        return Ok(updated);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        bool deleted = await venteService.Delete(id);

        if (!deleted)
        {
            return NotFound();
        }

        return NoContent();
    }
}