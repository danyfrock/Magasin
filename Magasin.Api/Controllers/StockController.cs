using Magasin.Api.Dtos;
using Magasin.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Magasin.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/stocks")]
public class StockController : ControllerBase
{
    private readonly StockService stockService;

    public StockController(StockService stockService)
    {
        this.stockService = stockService;
    }

    // GET : GETBYCODEBARRE - Récupère le stock d'un produit par son code-barres
    [HttpGet("codebarre/{codeBarre}")]
    public async Task<IActionResult> GetByCodeBarre(string codeBarre)
    {
        StockResponseDto? stock = await stockService.GetByCodeBarre(codeBarre);

        if (stock == null)
        {
            return NotFound();
        }

        return Ok(stock);
    }

    // GET : GETALL - Récupère tous les stocks
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        List<StockResponseDto> stocks = await stockService.GetAll();
        return Ok(stocks);
    }

    // PUT : UPDATEBYCODEBARRE - Modifie la quantité du stock d'un produit via son code-barres
    [HttpPut]
    public async Task<IActionResult> UpdateByCodeBarre(StockDto stock)
    {
        StockResponseDto? updated = await stockService.Update(stock);

        if (updated == null)
        {
            return NotFound();
        }

        return Ok(updated);
    }
}