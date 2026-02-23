using System.Security.Claims;
using InternOS.API.Application.DTOs;
using InternOS.API.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InternOS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProfileController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IWebHostEnvironment _environment;

    public ProfileController(AppDbContext context, IWebHostEnvironment environment)
    {
        _context = context;
        _environment = environment;
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetMyProfile()
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return NotFound(new { message = "User not found." });

        var photoUrl = GetLatestPhotoUrl(userId);

        return Ok(new
        {
            user.Id,
            user.FullName,
            user.Email,
            Role = user.Role.ToString(),
            ProfilePhotoUrl = photoUrl
        });
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpdateMyProfile([FromBody] UpdateProfileDto request)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return NotFound(new { message = "User not found." });

        var emailInUse = await _context.Users.AnyAsync(u => u.Email == request.Email && u.Id != userId);
        if (emailInUse) return BadRequest(new { message = "Email is already in use." });

        user.FullName = request.FullName.Trim();
        user.Email = request.Email.Trim();
        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Profile updated successfully.",
            user.FullName,
            user.Email
        });
    }

    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto request)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return NotFound(new { message = "User not found." });

        var oldPasswordIsValid = BCrypt.Net.BCrypt.Verify(request.OldPassword, user.PasswordHash);
        if (!oldPasswordIsValid)
            return BadRequest(new { message = "Old password is incorrect." });

        if (request.OldPassword == request.NewPassword)
            return BadRequest(new { message = "New password must be different from old password." });

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Password changed successfully." });
    }

    [HttpPost("photo")]
    [RequestSizeLimit(5 * 1024 * 1024)]
    public async Task<IActionResult> UploadProfilePhoto(IFormFile file)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return NotFound(new { message = "User not found." });

        if (file == null || file.Length == 0)
            return BadRequest(new { message = "Please select an image file." });

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        var allowed = new[] { ".jpg", ".jpeg", ".png", ".webp" };
        if (!allowed.Contains(ext))
            return BadRequest(new { message = "Only .jpg, .jpeg, .png, .webp files are allowed." });

        var profilePath = Path.Combine(_environment.ContentRootPath, "Uploads", "profile-photos", userId.ToString());
        Directory.CreateDirectory(profilePath);

        foreach (var oldFile in Directory.GetFiles(profilePath))
        {
            System.IO.File.Delete(oldFile);
        }

        var fileName = $"avatar_{DateTime.UtcNow:yyyyMMddHHmmss}{ext}";
        var fullPath = Path.Combine(profilePath, fileName);

        await using (var stream = System.IO.File.Create(fullPath))
        {
            await file.CopyToAsync(stream);
        }

        var url = $"{Request.Scheme}://{Request.Host}/uploads/profile-photos/{userId}/{fileName}";
        return Ok(new { message = "Profile photo uploaded successfully.", profilePhotoUrl = url });
    }

    private string? GetLatestPhotoUrl(int userId)
    {
        var profilePath = Path.Combine(_environment.ContentRootPath, "Uploads", "profile-photos", userId.ToString());
        if (!Directory.Exists(profilePath)) return null;

        var latest = Directory.GetFiles(profilePath)
            .Select(path => new FileInfo(path))
            .OrderByDescending(f => f.CreationTimeUtc)
            .FirstOrDefault();

        if (latest == null) return null;

        return $"{Request.Scheme}://{Request.Host}/uploads/profile-photos/{userId}/{latest.Name}";
    }
}
