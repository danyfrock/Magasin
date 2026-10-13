using Magasin.Api.Database;
using Magasin.Api.Database.Entities;
using Magasin.Api.Dtos;
using Magasin.Api.Mappings;
using Microsoft.EntityFrameworkCore;

namespace Magasin.Api.Services
{
    public class JournalService
    {
        private readonly MagasinDbContext dbContext;

        public JournalService(
            MagasinDbContext dbContext)
        {
            this.dbContext = dbContext;
        }

        public async Task<Journal> Create(JournalDto journal)
        {
            Journal entity = journal.ToEntity();
            dbContext.JournalModifications.Add(entity);

            await dbContext.SaveChangesAsync();

            return entity;
        }

        public async Task<List<JournalDto>> GetAll(
            string? typeEntite = null,
            int? entiteId = null,
            int? limit = null)
        {
            IQueryable<Journal> query =
                dbContext.JournalModifications;

            if (!string.IsNullOrWhiteSpace(typeEntite))
            {
                query = query.Where(j =>
                    j.TypeEntite == typeEntite);
            }

            if (entiteId.HasValue)
            {
                query = query.Where(j =>
                    j.EntiteId == entiteId);
            }

            return await query
                .OrderByDescending(j => j.DateUtc)
                .Select(j => j.ToDto())
                .Take(limit?? 1000)
                .ToListAsync();
        }
    }
}