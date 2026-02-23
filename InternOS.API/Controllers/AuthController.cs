using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using InternOS.API.Application.DTOs;
using InternOS.API.Domain.Entities;
using InternOS.API.Domain.Enums;
using InternOS.API.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace InternOS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthController(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }
    private string CreateToken(User user)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
            new Claim("FullName", user.FullName)
        };

        // Make sure your Jwt:Key in appsettings.json is at least 32 characters long!
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
            _configuration.GetSection("Jwt:Key").Value!));

        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.Now.AddDays(1), // Token lasts for 24 hours
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDto request)
    {
        // 1. Check if user exists
        if (await _context.Users.AnyAsync(u => u.Email == request.Email))
            return BadRequest("User with this email already exists.");

        // 2. Hash the password
        string passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

        // 3. Create the User object
        var user = new User
        {
            FullName = request.FullName,
            Email = request.Email,
            PasswordHash = passwordHash,
            Role = Enum.TryParse<UserRole>(request.Role, true, out var role) ? role : UserRole.Intern
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return Ok("User registered successfully!");
    }
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return BadRequest("Invalid email or password.");

        // This calls the CreateToken method we wrote earlier
        var token = CreateToken(user); 

        return Ok(new AuthResponseDto {
            Id = user.Id,
            Token = token,
            FullName = user.FullName,
            Role = user.Role.ToString()
        });
    }
}
