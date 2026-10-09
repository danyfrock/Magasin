using System.Text.Json;
using System.Text.Json.Serialization;
using Magasin.Api.Database;
using Magasin.Api.Services;
using Microsoft.AspNetCore.Authentication.Cookies;
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
builder.Services.AddScoped<AuthService>();

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    });

// Configuration de l'authentification par Cookies
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.Cookie.Name = "Magasin.AuthCookie";
        options.Cookie.HttpOnly = true;
        options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.ExpireTimeSpan = TimeSpan.FromDays(7);
        options.SlidingExpiration = true;

        // API : renvoyer des statuts HTTP au lieu de rediriger vers une page HTML
        options.Events.OnRedirectToLogin = context =>
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        };

        options.Events.OnRedirectToAccessDenied = context =>
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            return Task.CompletedTask;
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseDefaultFiles();
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

var imagesPath = Path.Combine(builder.Environment.ContentRootPath, "Images");

Directory.CreateDirectory(imagesPath);

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(imagesPath),
    RequestPath = "/Images"
});

app.MapControllers();

// EF Core : création / mise à jour automatique de la base et des tables
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<MagasinDbContext>();
    dbContext.Database.Migrate();

    // Création de l'administrateur par défaut après la migration
    var authService = scope.ServiceProvider.GetRequiredService<AuthService>();
    await authService.InitialiserAdminParDefautAsync();
}

app.Run();
