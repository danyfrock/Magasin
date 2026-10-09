using System.Security.Claims;
using Magasin.Api.Dtos;
using Magasin.Api.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Magasin.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AuthService authService;

    public AuthController(AuthService authService)
    {
        this.authService = authService;
    }

    /// <summary>
    /// Connexion : Vérifie les identifiants et pose le cookie d'authentification.
    /// </summary>
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var utilisateur = await authService.AuthentifierAsync(dto.Username, dto.Password);

        if (utilisateur == null)
        {
            return Unauthorized(new { message = "Nom d'utilisateur ou mot de passe incorrect." });
        }

        // Création des "Claims" (informations stockées dans l'identité de l'utilisateur connecté)
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, utilisateur.Id.ToString()),
            new(ClaimTypes.Name, utilisateur.Username),
            new(ClaimTypes.Role, utilisateur.Role)
        };

        var claimsIdentity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);

        // Connexion effective (génère et envoie le cookie au navigateur)
        await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, new ClaimsPrincipal(claimsIdentity));

        return Ok(new
        {
            message = "Connexion réussie",
            utilisateur.Username,
            utilisateur.Role,
            utilisateur.DoitChangerMotDePasse
        });
    }

    /// <summary>
    /// Déconnexion : Supprime le cookie d'authentification.
    /// </summary>
    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return Ok(new { message = "Déconnexion réussie" });
    }

    /// <summary>
    /// Modification du mot de passe (ex: obligatoire au premier lancement).
    /// </summary>
    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        // Récupération de l'ID de l'utilisateur connecté via les claims du cookie
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userIdClaim == null || !int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        // Vérification de l'ancien mot de passe avant de le changer
        // (On peut réutiliser la méthode d'authentification avec le nom d'utilisateur actuel)
        var username = User.FindFirstValue(ClaimTypes.Name);
        var utilisateurVerif = await authService.AuthentifierAsync(username ?? "", dto.OldPassword);

        if (utilisateurVerif == null)
        {
            return BadRequest(new { message = "L'ancien mot de passe est incorrect." });
        }

        var success = await authService.ChangerMotDePasseAsync(userId, dto.NewPassword);

        if (!success)
        {
            return BadRequest(new { message = "Erreur lors du changement de mot de passe." });
        }

        return Ok(new { message = "Mot de passe mis à jour avec succès." });
    }

    /// <summary>
    /// Permet au front-end de savoir si l'utilisateur est connecté et s'il doit changer son mot de passe.
    /// </summary>
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetCurrentUser()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userIdClaim == null || !int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        // Optionnel : on peut aller chercher l'état frais en base si besoin, 
        // ou simplement retourner les claims du cookie.
        return Ok(new
        {
            username = User.FindFirstValue(ClaimTypes.Name),
            role = User.FindFirstValue(ClaimTypes.Role)
        });
    }
}