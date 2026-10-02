using Magasin.Api.Database.Entities;
using Microsoft.EntityFrameworkCore;

namespace Magasin.Api.Database;

public class MagasinDbContext : DbContext
{
    public MagasinDbContext(DbContextOptions<MagasinDbContext> options)
        : base(options)
    {
    }

    public DbSet<Produit> Produits { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasSequence<long>("CodeBarreSequence")
            .StartsAt(200000000001)
            .IncrementsBy(1);

        modelBuilder.Entity<Produit>()
            .Property(p => p.CodeBarre)
            .HasDefaultValueSql("nextval('\"CodeBarreSequence\"')::text")
            .ValueGeneratedOnAdd();

        modelBuilder.Entity<Produit>()
            .HasIndex(p => p.CodeBarre)
            .IsUnique();
    }
}