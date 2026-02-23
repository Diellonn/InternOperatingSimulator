using InternOS.API.Infrastructure.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InternOS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")] // Dashboard is usually for managers/admins
public class DashboardController : ControllerBase
{
    private readonly ITaskRepository _taskRepo;

    public DashboardController(ITaskRepository taskRepo)
    {
        _taskRepo = taskRepo;
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var stats = await _taskRepo.GetDashboardStatsAsync();
        return Ok(stats);
    }
}