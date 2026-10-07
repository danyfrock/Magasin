using System.Text.Json;
using System.Text.Json.Serialization;
using Magasin.Api.Database;
using Magasin.Api.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);

// Charger le secret en production
var secretPath = Path.Combine(builder.Environment.ContentRootPath, "magasin.secret.json");

if (File.Exists(secretPath))
{
    var json = File.ReadAllText(secretPath);
    var secrets = JsonSerializer.Deserialize<Dictionary<string, string>>(json);

    if (secrets != null && secrets.TryGetValue("ConnectionStrings:Magasin", out string? connectionString))
    {
        builder.Configuration["ConnectionStrings:Magasin"] = connectionString;
    }
}

builder.WebHost.ConfigureKestrel(options =>
{
    options.ListenAnyIP(5143);
});

builder.Services.AddOpenApi();

builder.Services.AddDbContext<MagasinDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Magasin")));

builder.Services.AddScoped<ProduitService>();
builder.Services.AddScoped<VenteService>();
builder.Services.AddScoped<StockService>();
builder.Services.AddScoped<ImageService>();

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    });

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseDefaultFiles();
app.UseStaticFiles();

var imagesPath = Path.Combine(builder.Environment.ContentRootPath, "Images");
Directory.CreateDirectory(imagesPath);
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(imagesPath),
    RequestPath = "/Images"
});

app.MapControllers();

// EF Core : création automatique de la base + tables
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<MagasinDbContext>();
    dbContext.Database.Migrate();
}

app.Run();
