using Magasin.Api.Dtos;
using Magasin.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Magasin.Api.Controllers;

[Authorize(Roles = "Admin")] // Réservé aux admins
[ApiController]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private readonly UserService userService;

    public UsersController(UserService userService)
    {
        this.userService = userService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var users = await userService.GetAllAsync();
        return Ok(users);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserDto dto)
    {
        var createdUser = await userService.CreateAsync(dto);
        if (createdUser == null)
        {
            return BadRequest(new { message = "Ce nom d'utilisateur existe déjà." });
        }

        return Ok(createdUser);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var success = await userService.DeleteAsync(id);
        if (!success)
        {
            return NotFound(new { message = "Utilisateur introuvable." });
        }

        return Ok(new { message = "Utilisateur supprimé avec succès." });
    }
}