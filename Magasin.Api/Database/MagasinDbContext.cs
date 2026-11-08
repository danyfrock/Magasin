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
    public DbSet<Vente> Ventes { get; set; }
    public DbSet<Stock> Stocks { get; set; }
    public DbSet<Image> Images { get; set; }

    public DbSet<LigneVente> LignesVente { get; set; }

    public DbSet<LignePaiement> LignesPaiement { get; set; }

    public DbSet<Utilisateur> Utilisateurs { get; set; }
    public DbSet<Journal> Journaux { get; set; }
    public DbSet<LotTaux> LotsTaux { get; set; }
    public DbSet<TauxChange> TauxChanges { get; set; }

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

        modelBuilder.Entity<Stock>()
            .HasOne(s => s.Produit)
            .WithMany()
            .HasForeignKey(s => s.IdProduit)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<Stock>()
            .HasIndex(s => s.IdProduit)
            .IsUnique();
        modelBuilder.Entity<Utilisateur>()
            .HasIndex(u => u.Username)
            .IsUnique();

        // Montants monétaires
        modelBuilder.Entity<Vente>()
            .Property(v => v.Total)
            .HasPrecision(18, 2);

        modelBuilder.Entity<LigneVente>()
            .Property(lv => lv.PrixUnitaire)
            .HasPrecision(18, 2);

        modelBuilder.Entity<LignePaiement>()
            .Property(lp => lp.Montant)
            .HasPrecision(18, 2);

        // Taux de change
        modelBuilder.Entity<TauxChange>()
            .Property(tc => tc.Rate)
            .HasPrecision(18, 6);
    }
}