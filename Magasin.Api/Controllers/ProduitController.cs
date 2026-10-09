using Magasin.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Magasin.Api.Dtos;
using Microsoft.AspNetCore.Authorization;

namespace Magasin.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/produits")]
public class ProduitController : ControllerBase
{
    private readonly ProduitService produitService;

    public ProduitController(ProduitService produitService)
    {
        this.produitService = produitService;
    }

    [HttpGet("{codeBarre}")]
    public async Task<IActionResult> GetByCodeBarre(string codeBarre)
    {
        var produit = await produitService.GetByCodeBarre(codeBarre);

        if (produit == null)
        {
            return NotFound();
        }

        return Ok(produit);
    }
    
    [HttpPost]
    public async Task<IActionResult> Create(ProduitLightDto produit)
    {
        ProduitDto created = await produitService.Create(produit);

        return Ok(created);
    }

    [HttpPut]
    public async Task<IActionResult> Update(ProduitDto produit)
    {
        ProduitDto? updated = await produitService.Update(produit);

        if (updated == null)
        {
            return NotFound();
        }

        return Ok(updated);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        IEnumerable<ProduitDto> produits = await produitService.GetAll();

        return Ok(produits);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        bool deleted = await produitService.Delete(id);

        if (!deleted)
        {
            return NotFound();
        }

        return NoContent();
    }
}