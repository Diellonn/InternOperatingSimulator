using InternOS.API.Application.DTOs;
using InternOS.API.Domain.Entities;
using InternOS.API.Infrastructure.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;

namespace InternOS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TasksController : ControllerBase
{
    private readonly ITaskRepository _taskRepo;
    private readonly IActivityLogRepository _logRepo; // 1. Added field

    // 2. Updated constructor to accept both repositories
    public TasksController(ITaskRepository taskRepo, IActivityLogRepository logRepo)
    {
        _taskRepo = taskRepo;
        _logRepo = logRepo;
    }

    [HttpGet]
    public async Task<IActionResult> GetTasks()
    {
        var tasks = await _taskRepo.GetAllTasksAsync();
        
        var response = tasks.Select(t => new {
            t.Id,
            t.Title,
            t.Description,
            Status = t.Status.ToString(),
            t.CreatedAt,
            t.CompletedAt,
            t.AssignedToUserId,
            t.CreatedByUserId,
            // NEW: Show how many people are talking about this task
            CommentCount = t.Comments.Count, 
            // Optional: Show the latest comment
            LatestComment = t.Comments.OrderByDescending(c => c.CreatedAt)
                                    .Select(c => c.Content)
                                    .FirstOrDefault()
        });

        return Ok(response);
    }

    private static readonly HashSet<string> AllowedSubmissionExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".pdf", ".doc", ".docx", ".txt", ".png", ".jpg", ".jpeg", ".zip"
    };

    [HttpGet("{id}")]
    public async Task<IActionResult> GetTaskById(int id)
    {
        var task = await _taskRepo.GetTaskByIdAsync(id);
        if (task == null)
            return NotFound(new { message = "Task not found." });

        return Ok(new
        {
            task.Id,
            task.Title,
            task.Description,
            Status = task.Status.ToString(),
            task.AssignedToUserId,
            task.CreatedByUserId,
            task.CreatedAt,
            task.CompletedAt
        });
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Mentor")]
    public async Task<IActionResult> Create(CreateTaskDto dto)
    {
        var adminIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (adminIdClaim == null) return Unauthorized("Invalid token claims.");

        var adminId = int.Parse(adminIdClaim.Value);

        var task = new UserTask
        {
            Title = dto.Title,
            Description = dto.Description,
            AssignedToUserId = dto.AssignedToUserId,
            CreatedByUserId = adminId,
            Status = Domain.Enums.TaskStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        await _taskRepo.CreateTaskAsync(task);

        // 3. LOG THE CREATION
        await _logRepo.AddLogAsync(new ActivityLog {
            Action = "Task Created",
            UserId = adminId,
            TaskId = task.Id,
            Timestamp = DateTime.UtcNow
        });

        return Ok(new { message = "Task successfully assigned!", taskId = task.Id });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Mentor")]
    public async Task<IActionResult> DeleteTask(int id)
    {
        return await DeleteTaskInternal(id);
    }

    [HttpPost("{id}/delete")]
    [Authorize(Roles = "Admin,Mentor")]
    public async Task<IActionResult> DeleteTaskFallback(int id)
    {
        return await DeleteTaskInternal(id);
    }

    private async Task<IActionResult> DeleteTaskInternal(int id)
    {
        var requesterId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var task = await _taskRepo.GetTaskByIdAsync(id);
        if (task == null) return NotFound(new { message = "Task not found." });

        var taskTitle = task.Title;
        await _taskRepo.DeleteTaskAsync(task);

        var submissionsDir = Path.Combine(Directory.GetCurrentDirectory(), "Uploads", "task-submissions", id.ToString());
        if (Directory.Exists(submissionsDir))
        {
            Directory.Delete(submissionsDir, true);
        }

        await _logRepo.AddLogAsync(new ActivityLog
        {
            Action = $"Task Deleted: {taskTitle}",
            UserId = requesterId,
            TaskId = null,
            Timestamp = DateTime.UtcNow
        });

        return Ok(new { message = "Task deleted successfully." });
    }

    [HttpPatch("{id}/status")]
    [Authorize(Roles = "Admin,Mentor")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] int statusValue)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null) return Unauthorized();

        var task = await _taskRepo.GetTaskByIdAsync(id);
        if (task == null) return NotFound();

        var oldStatus = task.Status.ToString();
        task.Status = (InternOS.API.Domain.Enums.TaskStatus)statusValue;
        
        await _taskRepo.UpdateTaskAsync(task);

        // 4. LOG THE STATUS UPDATE
        await _logRepo.AddLogAsync(new ActivityLog {
            Action = $"Status Changed from {oldStatus} to {task.Status}",
            UserId = int.Parse(userIdClaim.Value),
            TaskId = task.Id,
            Timestamp = DateTime.UtcNow
        });

        return Ok(new { message = "Status updated!", newStatus = task.Status.ToString() });
    }

    [HttpPatch("{id}/submit")]
    [Authorize]
    public async Task<IActionResult> SubmitTask(int id)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var userRole = User.FindFirst(ClaimTypes.Role)!.Value;

        var task = await _taskRepo.GetTaskByIdAsync(id);
        if (task == null) return NotFound("Task not found.");

        if (userRole != "Intern" || task.AssignedToUserId != userId)
        {
            return Forbid("Only the assigned intern can submit this task for review.");
        }

        if (task.Status == Domain.Enums.TaskStatus.Completed)
            return BadRequest(new { message = "Completed tasks cannot be submitted again." });

        task.Status = Domain.Enums.TaskStatus.Submitted;
        task.CompletedAt = null;

        await _taskRepo.UpdateTaskAsync(task);

        await _logRepo.AddLogAsync(new ActivityLog {
            Action = "Task Submitted for Review",
            UserId = userId,
            TaskId = task.Id,
            Timestamp = DateTime.UtcNow
        });

        return Ok(new { message = "Task submitted for review!", newStatus = task.Status.ToString() });
    }

    [HttpPatch("{id}/complete")]
    [Authorize]
    public async Task<IActionResult> CompleteTask(int id)
    {
        return await SubmitTask(id);
    }

    [HttpPatch("{id}/review")]
    [Authorize(Roles = "Admin,Mentor")]
    public async Task<IActionResult> ReviewTask(int id, [FromBody] ReviewTaskDto request)
    {
        var reviewerId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        var task = await _taskRepo.GetTaskByIdAsync(id);
        if (task == null) return NotFound(new { message = "Task not found." });

        if (task.Status != Domain.Enums.TaskStatus.Submitted)
            return BadRequest(new { message = "Only submitted tasks can be reviewed." });

        task.Status = request.Approved ? Domain.Enums.TaskStatus.Completed : Domain.Enums.TaskStatus.InProgress;
        task.CompletedAt = request.Approved ? DateTime.UtcNow : null;

        await _taskRepo.UpdateTaskAsync(task);

        var action = request.Approved ? "Task Approved" : "Task Rejected (Needs Revision)";
        if (!string.IsNullOrWhiteSpace(request.Feedback))
            action = $"{action}: {request.Feedback}";

        await _logRepo.AddLogAsync(new ActivityLog {
            Action = action,
            UserId = reviewerId,
            TaskId = task.Id,
            Timestamp = DateTime.UtcNow
        });

        return Ok(new
        {
            message = request.Approved ? "Task approved." : "Task sent back for revision.",
            newStatus = task.Status.ToString(),
            completedAt = task.CompletedAt
        });
    }

    [HttpPost("{id}/submission")]
    [Authorize]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<IActionResult> UploadSubmission(int id, IFormFile file)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var userRole = User.FindFirst(ClaimTypes.Role)!.Value;

        var task = await _taskRepo.GetTaskByIdAsync(id);
        if (task == null) return NotFound(new { message = "Task not found." });

        if (userRole != "Intern" || task.AssignedToUserId != userId)
            return Forbid("Only the assigned intern can upload submissions.");

        if (file == null || file.Length == 0)
            return BadRequest(new { message = "Please select a file to upload." });

        var extension = Path.GetExtension(file.FileName);
        if (!AllowedSubmissionExtensions.Contains(extension))
            return BadRequest(new { message = "File type not allowed." });

        var uploadsRoot = Path.Combine(Directory.GetCurrentDirectory(), "Uploads", "task-submissions", id.ToString());
        Directory.CreateDirectory(uploadsRoot);

        var safeBaseName = Path.GetFileNameWithoutExtension(file.FileName);
        var safeName = string.Concat(safeBaseName.Split(Path.GetInvalidFileNameChars())).Trim();
        if (string.IsNullOrWhiteSpace(safeName))
            safeName = "submission";

        var storedFileName = $"{DateTime.UtcNow:yyyyMMddHHmmss}_{userId}_{safeName}{extension}";
        var filePath = Path.Combine(uploadsRoot, storedFileName);

        await using (var stream = System.IO.File.Create(filePath))
        {
            await file.CopyToAsync(stream);
        }

        task.Status = InternOS.API.Domain.Enums.TaskStatus.Submitted;
        task.CompletedAt = null;
        await _taskRepo.UpdateTaskAsync(task);

        await _logRepo.AddLogAsync(new ActivityLog
        {
            Action = "Task Submission Uploaded",
            UserId = userId,
            TaskId = task.Id,
            Timestamp = DateTime.UtcNow
        });

        var publicUrl = $"{Request.Scheme}://{Request.Host}/uploads/task-submissions/{id}/{storedFileName}";

        return Ok(new
        {
            message = "Submission uploaded successfully and sent for review.",
            fileName = storedFileName,
            fileUrl = publicUrl,
            newStatus = task.Status.ToString()
        });
    }

    [HttpGet("{id}/submissions")]
    [Authorize]
    public async Task<IActionResult> GetSubmissions(int id)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var userRole = User.FindFirst(ClaimTypes.Role)!.Value;

        var task = await _taskRepo.GetTaskByIdAsync(id);
        if (task == null) return NotFound(new { message = "Task not found." });

        var canAccess = userRole == "Admin" || userRole == "Mentor" || task.AssignedToUserId == userId;
        if (!canAccess) return Forbid();

        var uploadsRoot = Path.Combine(Directory.GetCurrentDirectory(), "Uploads", "task-submissions", id.ToString());
        if (!Directory.Exists(uploadsRoot))
            return Ok(Array.Empty<object>());

        var files = Directory.GetFiles(uploadsRoot)
            .Select(path => new FileInfo(path))
            .OrderByDescending(f => f.CreationTimeUtc)
            .Select(f => new
            {
                fileName = f.Name,
                fileUrl = $"{Request.Scheme}://{Request.Host}/uploads/task-submissions/{id}/{f.Name}",
                sizeBytes = f.Length,
                uploadedAt = f.CreationTimeUtc
            })
            .ToList();

        return Ok(files);
    }
    [HttpGet("my-tasks")]
    public async Task<IActionResult> GetMyTasks()
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        
        // You'll need to add this method to your repository
        var tasks = await _taskRepo.GetTasksByUserIdAsync(userId);

        return Ok(tasks.Select(t => new {
            t.Id,
            t.Title,
            t.Description,
            Status = t.Status.ToString(),
            t.CreatedAt
        }));
    }
}
