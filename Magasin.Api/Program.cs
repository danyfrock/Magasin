using Magasin.Api.Database;
using Magasin.Api.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();


builder.Services.AddDbContext<MagasinDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Magasin")));
builder.Services.AddScoped<ProduitService>();
builder.Services.AddControllers();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseDefaultFiles();
app.UseStaticFiles();
app.MapControllers();

app.Run();
