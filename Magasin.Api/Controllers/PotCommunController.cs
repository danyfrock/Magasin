using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Magasin.Api.Dtos;
using Magasin.Api.Services;

namespace Magasin.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PotCommunController : ControllerBase
    {
        private readonly PotCommunService potCommunService;

        public PotCommunController(
            PotCommunService potCommunService)
        {
            this.potCommunService = potCommunService;
        }

        [HttpGet]
        public async Task<ActionResult<List<PotCommunResponseDto>>> GetRecent()
        {
            return Ok(
                await potCommunService.GetRecent());
        }

        [HttpGet("user/{utilisateurId:int}")]
        public async Task<ActionResult<List<PotCommunResponseDto>>> GetUserRecent(
            int utilisateurId)
        {
            return Ok(
                await potCommunService.GetUserRecent(utilisateurId));
        }

        [HttpPost]
        public async Task<ActionResult<PotCommunResponseDto>> Create(
            PotCommunCreateDto dto)
        {
            return Ok(
                await potCommunService.CreatePotCommun(dto));
        }
    }
}