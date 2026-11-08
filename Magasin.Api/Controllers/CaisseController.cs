using Magasin.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Magasin.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CaisseController : ControllerBase
    {
        private readonly CaisseService _caisseService;

        public CaisseController(CaisseService caisseService)
        {
            _caisseService = caisseService;
        }

        [HttpGet("devise")]
        public IActionResult GetDevise()
        {
            return Ok(new { DeviseCaisse = _caisseService.GetDeviseCaisse() });
        }

        [HttpGet("currencies")]
        public async Task<IActionResult> GetCurrencies()
        {
            var currencies = await _caisseService.GetCurrenciesAsync();
            return Ok(currencies);
        }

        [HttpGet("convertir")]
        public async Task<IActionResult> Convertir([FromQuery] decimal montant, [FromQuery] string from, [FromQuery] string to)
        {
            var resultat = await _caisseService.ConvertirAsync(montant, from, to);
            return Ok(resultat);
        }
    }
}