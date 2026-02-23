using InternOS.API.Infrastructure.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InternOS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // All authenticated users can see activity logs
public class ActivityController : ControllerBase
{
    private readonly IActivityLogRepository _logRepo;

    public ActivityController(IActivityLogRepository logRepo)
    {
        _logRepo = logRepo;
    }

    [HttpGet]
    public async Task<IActionResult> GetActivityHistory()
    {
        var logs = await _logRepo.GetLogsAsync();

        // We map to a clean object so we don't return unnecessary database junk
        var response = logs.Select(l => new
        {
            l.Id,
            l.Action,
            l.Timestamp,
            UserName = l.User?.FullName ?? "Unknown",
            TaskTitle = l.Task?.Title ?? "N/A"
        });

        return Ok(response);
    }
}