using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Magasin.Api.Database;
using Magasin.Api.Database.Entities;
using Magasin.Api.Dtos;
using Magasin.Api.Mappings;
using Microsoft.EntityFrameworkCore;

namespace Magasin.Api.Services
{
    public class PotCommunService
    {
        private readonly MagasinDbContext dbContext;
        private readonly VenteService venteService;
        private readonly IConfiguration configuration;

        public PotCommunService(MagasinDbContext dbContext, VenteService venteService, IConfiguration configuration)
        {
            this.dbContext = dbContext;
            this.venteService = venteService;
            this.configuration = configuration;
        }

        public async Task<PotCommun> CreatePotCommun(PotCommunCreateDto dto)
        {
            VenteResponseDto? vente = null;
            if (dto.Vente != null)
            {
                vente = await venteService.Create(dto.Vente);
            }
            var potCommun = dto.ToEntity(vente?.Id?? null);

            await dbContext.PotsCommuns.AddAsync(potCommun);
            await dbContext.SaveChangesAsync();

            return potCommun;
        }
        
        public Task<List<PotCommunResponseDto>> GetRecent()
        {
            return GetRecent(null);
        }

        public Task<List<PotCommunResponseDto>> GetUserRecent(
            int utilisateurId)
        {
            return GetRecent(utilisateurId);
        }

        private async Task<List<PotCommunResponseDto>> GetRecent(
            int? utilisateurId)
        {
            int maxLength = configuration.GetValue<int>(
                "PotCommunSettings:PotCommunMaxLengh");

            List<PotCommun> potsCommuns = await dbContext.PotsCommuns
                .AsNoTracking()
                .Include(p => p.Utilisateur)
                .Include(p => p.Produit)
                .Include(p => p.Vente)
                .Where(p =>
                    utilisateurId == null ||
                    p.UtilisateurId == utilisateurId)
                .OrderByDescending(p => p.DateCreation)
                .ThenByDescending(p => p.Id)
                .Take(maxLength)
                .ToListAsync();

            return potsCommuns
                .Select(p => p.ToDto())
                .ToList();
        }
    }
}