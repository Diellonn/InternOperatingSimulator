namespace InternOS.API.Application.DTOs;

public class StartConversationDto
{
    public int ParticipantUserId { get; set; }
}

public class SendMessageDto
{
    public string ConversationId { get; set; } = string.Empty;
    public int RecipientUserId { get; set; }
    public string Content { get; set; } = string.Empty;
}
