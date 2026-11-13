using System.Text.Json.Serialization;
using Magasin.Api.Database;
using Magasin.Api.Services;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);

// Charger le secret en production s'il existe (gère nativement le format imbriqué standard)
var secretPath = Path.Combine(builder.Environment.ContentRootPath, "magasin.secret.json");
if (File.Exists(secretPath))
{
    builder.Configuration.AddJsonFile(secretPath, optional: true, reloadOnChange: true);
}

builder.WebHost.UseUrls(builder.Configuration["Urls"] ?? "http://0.0.0.0:5143");

builder.Services.AddOpenApi();

builder.Services.AddDbContext<MagasinDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Magasin")));

builder.Services.AddHttpContextAccessor();
builder.Services.AddHttpClient();
builder.Services.AddScoped<ProduitService>();
builder.Services.AddScoped<VenteService>();
builder.Services.AddScoped<StockService>();
builder.Services.AddScoped<ImageService>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<JournalService>();
builder.Services.AddScoped<TauxChangeService>();
builder.Services.AddScoped<CaisseService>();
builder.Services.AddScoped<ImageAnalysisService>();

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

    var authService = scope.ServiceProvider.GetRequiredService<AuthService>();
    await authService.InitialiserAdminParDefautAsync();
}

app.Run();