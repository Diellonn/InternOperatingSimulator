using InternOS.API.Domain.Enums;
using TaskStatus = InternOS.API.Domain.Enums.TaskStatus;
namespace InternOS.API.Domain.Entities;

public class UserTask
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public TaskStatus Status { get; set; } = TaskStatus.Pending;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DueDate { get; set; }

    public DateTime? CompletedAt { get; set; }

    // Foreign Key for the Intern
    public int AssignedToUserId { get; set; }
    public User AssignedTo { get; set; } = null!;

    // Foreign Key for the Admin/Creator
    public int CreatedByUserId { get; set; }
    public User CreatedBy { get; set; } = null!;
    public List<Comment> Comments { get; set; } = new();
}
