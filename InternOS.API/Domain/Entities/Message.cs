namespace InternOS.API.Domain.Entities;

public class Message
{
    public int Id { get; set; }
    public int SenderUserId { get; set; }
    public User SenderUser { get; set; } = null!;
    public int RecipientUserId { get; set; }
    public User RecipientUser { get; set; } = null!;
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
