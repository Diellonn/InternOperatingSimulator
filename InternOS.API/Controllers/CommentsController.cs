using InternOS.API.Domain.Entities;
using InternOS.API.Infrastructure.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InternOS.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class CommentsController : ControllerBase
{
    private readonly ICommentRepository _commentRepo;

    public CommentsController(ICommentRepository commentRepo)
    {
        _commentRepo = commentRepo;
    }

    [HttpGet("task/{taskId}")]
    public async Task<IActionResult> GetTaskComments(int taskId)
    {
        var comments = await _commentRepo.GetCommentsByTaskIdAsync(taskId);

        return Ok(comments.Select(c => new
        {
            c.Id,
            c.Content,
            c.CreatedAt,
            UserName = c.User.FullName
        }));
    }

    [HttpPost]
    public async Task<IActionResult> PostComment([FromQuery] int taskId, [FromQuery] string content)
    {
        if (taskId <= 0)
            return BadRequest(new { message = "Invalid taskId." });

        if (string.IsNullOrWhiteSpace(content))
            return BadRequest(new { message = "Comment content is required." });

        var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);

        var comment = new Comment
        {
            TaskId = taskId,
            UserId = userId,
            Content = content,
            CreatedAt = DateTime.UtcNow
        };

        await _commentRepo.AddCommentAsync(comment);
        return Ok(new { message = "Comment added successfully!" });
    }
}
