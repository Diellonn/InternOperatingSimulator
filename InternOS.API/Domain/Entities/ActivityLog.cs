namespace InternOS.API.Domain.Entities;

public class ActivityLog
{
    public int Id { get; set; }
    public string Action { get; set; } = string.Empty; // e.g., "Task Status Updated"
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    // Relationships
    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public int? TaskId { get; set; } // Nullable because some logs might be login/logout
    public UserTask? Task { get; set; }
}