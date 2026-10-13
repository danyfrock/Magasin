using Magasin.Api.Dtos;
using Magasin.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Magasin.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/journals")]
    public class JournalController : ControllerBase
    {
        private readonly JournalService journalService;

        public JournalController(JournalService journalService)
        {
            this.journalService = journalService;
        }

        // GET : Récupère les entrées du journal (filtres optionnels)
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? typeEntite = null,
            [FromQuery] int? entiteId = null,
            [FromQuery] int? limit = null)
        {
            List<JournalDto> journals = await journalService.GetAll(typeEntite, entiteId, limit);
            return Ok(journals);
        }

        // POST : Crée une entrée de journal
        [HttpPost]
        public async Task<IActionResult> Create(JournalDto journal)
        {
            var created = await journalService.Create(journal);
            return Ok(created);
        }
    }
}