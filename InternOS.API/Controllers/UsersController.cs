using InternOS.API.Infrastructure.Data;
using InternOS.API.Application.DTOs;
using InternOS.API.Domain.Entities;
using InternOS.API.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace InternOS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _context;

    public UsersController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAllUsers()
    {
        try
        {
            var users = await _context.Users
                .Select(u => new
                {
                    u.Id,
                    u.FullName,
                    u.Email,
                    Role = u.Role.ToString()
                })
                .ToListAsync();

            return Ok(users);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error fetching users", error = ex.Message });
        }
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetUserById(int id)
    {
        try
        {
            var user = await _context.Users
                .Where(u => u.Id == id)
                .Select(u => new
                {
                    u.Id,
                    u.FullName,
                    u.Email,
                    Role = u.Role.ToString()
                })
                .FirstOrDefaultAsync();

            if (user == null)
                return NotFound(new { message = "User not found" });

            return Ok(user);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error fetching user", error = ex.Message });
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserDto request)
    {
        try
        {
            // Check if user already exists
            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
                return BadRequest(new { message = "User with this email already exists" });

            // Hash password
            string passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

            // Parse role
            var role = Enum.TryParse<UserRole>(request.Role, true, out var parsedRole) 
                ? parsedRole 
                : UserRole.Intern;

            var user = new User
            {
                FullName = request.FullName,
                Email = request.Email,
                PasswordHash = passwordHash,
                Role = role
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "User created successfully",
                user = new
                {
                    user.Id,
                    user.FullName,
                    user.Email,
                    Role = user.Role.ToString()
                }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error creating user", error = ex.Message });
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserDto request)
    {
        try
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
                return NotFound(new { message = "User not found" });

            // Check if new email is already taken by another user
            if (!string.IsNullOrEmpty(request.Email) && request.Email != user.Email)
            {
                if (await _context.Users.AnyAsync(u => u.Email == request.Email && u.Id != id))
                    return BadRequest(new { message = "Email already in use" });
                user.Email = request.Email;
            }

            if (!string.IsNullOrEmpty(request.FullName))
                user.FullName = request.FullName;

            if (!string.IsNullOrEmpty(request.Role))
            {
                if (Enum.TryParse<UserRole>(request.Role, true, out var role))
                    user.Role = role;
            }

            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "User updated successfully",
                user = new
                {
                    user.Id,
                    user.FullName,
                    user.Email,
                    Role = user.Role.ToString()
                }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error updating user", error = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteUser(int id, [FromQuery] int? reassignToUserId = null)
    {
        try
        {
            var currentUserIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (int.TryParse(currentUserIdClaim, out var currentUserId) && currentUserId == id)
                return BadRequest(new { message = "You cannot delete your own account." });

            var user = await _context.Users.FindAsync(id);
            if (user == null)
                return NotFound(new { message = "User not found" });

            if (reassignToUserId.HasValue && reassignToUserId.Value == id)
                return BadRequest(new { message = "Replacement user cannot be the same as the user being deleted." });

            var assignedTasksCount = await _context.UserTasks.CountAsync(t => t.AssignedToUserId == id);
            var createdTasksCount = await _context.UserTasks.CountAsync(t => t.CreatedByUserId == id);
            var commentsCount = await _context.Comments.CountAsync(c => c.UserId == id);
            var activitiesCount = await _context.ActivityLogs.CountAsync(a => a.UserId == id);

            var hasDependencies = assignedTasksCount > 0 || createdTasksCount > 0 || commentsCount > 0 || activitiesCount > 0;

            if (hasDependencies && !reassignToUserId.HasValue)
            {
                return BadRequest(new
                {
                    message = "Cannot delete user because related records exist. Provide reassignToUserId to transfer ownership.",
                    dependencies = new
                    {
                        assignedTasks = assignedTasksCount,
                        createdTasks = createdTasksCount,
                        comments = commentsCount,
                        activities = activitiesCount
                    }
                });
            }

            if (reassignToUserId.HasValue)
            {
                var replacementUser = await _context.Users.FindAsync(reassignToUserId.Value);
                if (replacementUser == null)
                    return BadRequest(new { message = "Replacement user not found." });

                await using var transaction = await _context.Database.BeginTransactionAsync();

                var assignedTasks = await _context.UserTasks.Where(t => t.AssignedToUserId == id).ToListAsync();
                foreach (var task in assignedTasks)
                    task.AssignedToUserId = reassignToUserId.Value;

                var createdTasks = await _context.UserTasks.Where(t => t.CreatedByUserId == id).ToListAsync();
                foreach (var task in createdTasks)
                    task.CreatedByUserId = reassignToUserId.Value;

                var comments = await _context.Comments.Where(c => c.UserId == id).ToListAsync();
                foreach (var comment in comments)
                    comment.UserId = reassignToUserId.Value;

                var activityLogs = await _context.ActivityLogs.Where(a => a.UserId == id).ToListAsync();
                foreach (var log in activityLogs)
                    log.UserId = reassignToUserId.Value;

                _context.Users.Remove(user);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(new { message = "User reassigned and deleted successfully." });
            }

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "User deleted successfully" });
        }
        catch (DbUpdateException ex)
        {
            return BadRequest(new
            {
                message = "Cannot delete user because related records exist.",
                error = ex.InnerException?.Message ?? ex.Message
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error deleting user", error = ex.Message });
        }
    }

    [HttpGet("interns")]
    [Authorize(Roles = "Admin,Mentor")]
    public async Task<IActionResult> GetInterns()
    {
        try
        {
            var interns = await _context.Users
                .Where(u => u.Role == UserRole.Intern)
                .Select(u => new
                {
                    u.Id,
                    u.FullName,
                    u.Email,
                    Role = u.Role.ToString()
                })
                .ToListAsync();

            return Ok(interns);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error fetching interns", error = ex.Message });
        }
    }

    [HttpGet("mentors")]
    [Authorize]
    public async Task<IActionResult> GetMentors()
    {
        try
        {
            var mentors = await _context.Users
                .Where(u => u.Role == UserRole.Mentor)
                .Select(u => new
                {
                    u.Id,
                    u.FullName,
                    u.Email,
                    Role = u.Role.ToString()
                })
                .ToListAsync();

            return Ok(mentors);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error fetching mentors", error = ex.Message });
        }
    }

    [HttpGet("{id}/dependencies")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetUserDependencies(int id)
    {
        try
        {
            var userExists = await _context.Users.AnyAsync(u => u.Id == id);
            if (!userExists)
                return NotFound(new { message = "User not found" });

            var assignedTasks = await _context.UserTasks.CountAsync(t => t.AssignedToUserId == id);
            var createdTasks = await _context.UserTasks.CountAsync(t => t.CreatedByUserId == id);
            var comments = await _context.Comments.CountAsync(c => c.UserId == id);
            var activities = await _context.ActivityLogs.CountAsync(a => a.UserId == id);

            var totalTasks = assignedTasks + createdTasks;
            var totalDependencies = totalTasks + comments + activities;

            return Ok(new
            {
                assignedTasks,
                createdTasks,
                totalTasks,
                comments,
                activities,
                totalDependencies,
                hasDependencies = totalDependencies > 0
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error fetching user dependencies", error = ex.Message });
        }
    }
}
