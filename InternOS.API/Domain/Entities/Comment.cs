namespace InternOS.API.Domain.Entities;

public class Comment
{
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Relationships
    public int TaskId { get; set; }
    public UserTask Task { get; set; } = null!;

    public int UserId { get; set; }
    public User User { get; set; } = null!;
}