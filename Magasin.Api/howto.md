# EF Core Code First

## 1. Installer EF Core + PostgreSQL

```cmd
dotnet add package Microsoft.EntityFrameworkCore.Design
dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL
dotnet tool update --global dotnet-ef --version 10.*
```

## 2. Créer l'entité

`Database/Entities/Produit.cs`

```csharp
public class Produit
{
    public int Id { get; set; }
    public required string CodeBarre { get; set; }
    public required string Nom { get; set; }
    public int Prix { get; set; }
}
```

## 3. Créer le DbContext

`Database/MagasinDbContext.cs`

```csharp
public class MagasinDbContext : DbContext
{
    public MagasinDbContext(DbContextOptions<MagasinDbContext> options)
        : base(options)
    {
    }

    public DbSet<Produit> Produits { get; set; }
}
```

## 4. Configurer la connexion

`appsettings.json`

```json
"ConnectionStrings": {
    "Magasin": "Host=localhost;Port=5432;Database=magasin;Username=postgres;Password=..."
}
```

## 5. Enregistrer le DbContext

`Program.cs`

```csharp
builder.Services.AddDbContext<MagasinDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Magasin")));
```

## 6. Créer une migration

```cmd
dotnet ef migrations add InitialCreate
```

## 7. Appliquer la migration à PostgreSQL

```cmd
dotnet ef database update
```

EF crée ou modifie automatiquement les tables selon les migrations.

## 8. Modifier le modèle

Après une modification de l'entité :

```cmd
dotnet ef migrations add NomDeLaModification
dotnet ef database update
```

Ne pas modifier manuellement les tables : les changements de structure passent par les migrations.

## 9. Vérifier les migrations appliquées

PostgreSQL contient :

```text
__EFMigrationsHistory
```

Cette table indique quelles migrations ont déjà été appliquées.
