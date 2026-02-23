using InternOS.API.Domain.Entities;

namespace InternOS.API.Application.DTOs;

public class DashboardStatsDto
{
    public int TotalTasks { get; set; }
    public int PendingTasks { get; set; }
    public int InProgressTasks { get; set; }
    public int CompletedTasks { get; set; }
    public int TotalInterns { get; set; }
    public int ActiveMentors { get; set; }
    public int CommentsToday { get; set; }
    public int HealthScore { get; set; }
    
    // NEW: The list of recent events
    public List<ActivityLogDto> RecentActivity { get; set; } = new();
}

public class ActivityLogDto 
{
    public string Action { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
}
