using InternOS.API.Domain.Entities;
using InternOS.API.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

public class ActivityLogRepository : IActivityLogRepository
{
    private readonly AppDbContext _context;
    public ActivityLogRepository(AppDbContext context) => _context = context;

    public async Task AddLogAsync(ActivityLog log)
    {
        _context.ActivityLogs.Add(log);
        await _context.SaveChangesAsync();
    }

    public async Task<IEnumerable<ActivityLog>> GetLogsAsync()
    {
        return await _context.ActivityLogs
            .Include(l => l.User)
            .Include(l => l.Task)
            .OrderByDescending(l => l.Timestamp)
            .ToListAsync();
    }
}