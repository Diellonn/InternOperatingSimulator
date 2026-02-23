using InternOS.API.Domain.Entities;

public interface IActivityLogRepository
{
    Task AddLogAsync(ActivityLog log);
    Task<IEnumerable<ActivityLog>> GetLogsAsync();
}