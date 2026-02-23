using InternOS.API.Application.DTOs;
using InternOS.API.Domain.Entities;
using InternOS.API.Domain.Enums;
using InternOS.API.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InternOS.API.Infrastructure.Repositories;

public class TaskRepository : ITaskRepository
{
    private readonly AppDbContext _context;

    public TaskRepository(AppDbContext context) => _context = context;

    public async Task<IEnumerable<UserTask>> GetAllTasksAsync()
    {
        return await _context.UserTasks
            .Include(t => t.AssignedTo)
            .Include(t => t.CreatedBy)
            .Include(t => t.Comments)
            .ToListAsync();
    }

    public async Task<UserTask?> GetTaskByIdAsync(int id) => 
        await _context.UserTasks
            .Include(t => t.AssignedTo)
            .Include(t => t.CreatedBy)
            .Include(t => t.Comments)
            .FirstOrDefaultAsync(t => t.Id == id);

    public async Task<UserTask> CreateTaskAsync(UserTask task)
    {
        _context.UserTasks.Add(task);
        await _context.SaveChangesAsync();
        return task;
    }

    public async Task UpdateTaskAsync(UserTask task)
    {
        _context.Entry(task).State = EntityState.Modified;
        await _context.SaveChangesAsync();
    }

    public async Task DeleteTaskAsync(UserTask task)
    {
        var relatedLogs = await _context.ActivityLogs
            .Where(a => a.TaskId == task.Id)
            .ToListAsync();

        foreach (var log in relatedLogs)
        {
            log.TaskId = null;
        }

        _context.UserTasks.Remove(task);
        await _context.SaveChangesAsync();
    }

    public async Task<DashboardStatsDto> GetDashboardStatsAsync()
    {
        var stats = new DashboardStatsDto
        {
            TotalTasks = await _context.UserTasks.CountAsync(),
            PendingTasks = await _context.UserTasks.CountAsync(t => (int)t.Status == 0),
            InProgressTasks = await _context.UserTasks.CountAsync(t => (int)t.Status == 1),
            CompletedTasks = await _context.UserTasks.CountAsync(t => (int)t.Status == 2),
            TotalInterns = await _context.Users.CountAsync(static u => u.Role == UserRole.Intern),
            CommentsToday = await _context.Comments.CountAsync(c => c.CreatedAt >= DateTime.UtcNow.Date),
            
            // Fetch the 5 most recent activities
            RecentActivity = await _context.ActivityLogs
                .Include(l => l.User)
                .OrderByDescending(l => l.Timestamp)
                .Take(5)
                .Select(l => new ActivityLogDto
                {
                    Action = l.Action,
                    UserName = l.User.FullName,
                    Timestamp = l.Timestamp
                })
                .ToListAsync()
        };

        return stats;
    }

    public async Task<IEnumerable<UserTask>> GetTasksByUserIdAsync(int userId)
    {
        return await _context.UserTasks
            .Where(t => t.AssignedToUserId == userId)
            .Include(t => t.CreatedBy) // So the intern knows who assigned it
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();
    }
}
