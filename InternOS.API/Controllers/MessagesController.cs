using System.Security.Claims;
using InternOS.API.Application.DTOs;
using InternOS.API.Domain.Entities;
using InternOS.API.Infrastructure.Data;
using InternOS.API.Infrastructure.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InternOS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MessagesController : ControllerBase
{
    private readonly IMessageRepository _messageRepo;
    private readonly AppDbContext _context;

    public MessagesController(IMessageRepository messageRepo, AppDbContext context)
    {
        _messageRepo = messageRepo;
        _context = context;
    }

    [HttpGet("conversations")]
    public async Task<IActionResult> GetConversations()
    {
        var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var currentUser = await _context.Users.FirstOrDefaultAsync(u => u.Id == currentUserId);
        if (currentUser == null) return Unauthorized();

        var messages = await _messageRepo.GetMessagesForUserAsync(currentUserId);

        var conversations = messages
            .GroupBy(m => BuildConversationId(m.SenderUserId, m.RecipientUserId))
            .Select(group =>
            {
                var latestMessage = group.OrderByDescending(m => m.CreatedAt).First();
                var partner = latestMessage.SenderUserId == currentUserId ? latestMessage.RecipientUser : latestMessage.SenderUser;

                return new
                {
                    Id = group.Key,
                    ParticipantIds = new[] { currentUserId, partner.Id },
                    ParticipantNames = new[] { currentUser.FullName, partner.FullName },
                    ParticipantRoles = new[] { currentUser.Role.ToString(), partner.Role.ToString() },
                    LastMessage = latestMessage.Content,
                    LastMessageAt = latestMessage.CreatedAt
                };
            })
            .OrderByDescending(c => c.LastMessageAt)
            .ToList();

        return Ok(conversations);
    }

    [HttpGet("conversations/{conversationId}")]
    public async Task<IActionResult> GetConversationMessages(string conversationId)
    {
        var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var ids = ParseConversationId(conversationId);
        if (ids == null) return BadRequest(new { message = "Invalid conversation id." });
        if (ids.Value.userIdA != currentUserId && ids.Value.userIdB != currentUserId) return Forbid();

        var messages = await _messageRepo.GetMessagesForConversationAsync(ids.Value.userIdA, ids.Value.userIdB);
        var response = messages.Select(m => new
        {
            Id = $"msg-{m.Id}",
            ConversationId = BuildConversationId(m.SenderUserId, m.RecipientUserId),
            SenderId = m.SenderUserId,
            SenderName = m.SenderUser.FullName,
            SenderRole = m.SenderUser.Role.ToString(),
            RecipientId = m.RecipientUserId,
            Content = m.Content,
            CreatedAt = m.CreatedAt
        });

        return Ok(response);
    }

    [HttpPost("conversations")]
    public async Task<IActionResult> StartConversation([FromBody] StartConversationDto request)
    {
        if (request.ParticipantUserId <= 0) return BadRequest(new { message = "Invalid participant user id." });

        var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        if (currentUserId == request.ParticipantUserId)
            return BadRequest(new { message = "Cannot start a conversation with yourself." });

        var currentUser = await _context.Users.FirstOrDefaultAsync(u => u.Id == currentUserId);
        var partner = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.ParticipantUserId);
        if (currentUser == null || partner == null) return NotFound(new { message = "User not found." });

        var conversationId = BuildConversationId(currentUserId, request.ParticipantUserId);

        return Ok(new
        {
            Id = conversationId,
            ParticipantIds = new[] { currentUserId, request.ParticipantUserId },
            ParticipantNames = new[] { currentUser.FullName, partner.FullName },
            ParticipantRoles = new[] { currentUser.Role.ToString(), partner.Role.ToString() },
            LastMessage = "Conversation started",
            LastMessageAt = DateTime.UtcNow
        });
    }

    [HttpPost]
    public async Task<IActionResult> SendMessage([FromBody] SendMessageDto request)
    {
        var senderUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        if (request.RecipientUserId <= 0) return BadRequest(new { message = "Invalid recipient user id." });
        if (string.IsNullOrWhiteSpace(request.Content)) return BadRequest(new { message = "Message content is required." });
        if (senderUserId == request.RecipientUserId) return BadRequest(new { message = "Cannot send a message to yourself." });

        var sender = await _context.Users.FirstOrDefaultAsync(u => u.Id == senderUserId);
        var recipient = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.RecipientUserId);
        if (sender == null || recipient == null) return NotFound(new { message = "User not found." });

        var message = new Message
        {
            SenderUserId = senderUserId,
            RecipientUserId = request.RecipientUserId,
            Content = request.Content.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        var saved = await _messageRepo.AddMessageAsync(message);

        return Ok(new
        {
            Id = $"msg-{saved.Id}",
            ConversationId = BuildConversationId(senderUserId, request.RecipientUserId),
            SenderId = senderUserId,
            SenderName = sender.FullName,
            SenderRole = sender.Role.ToString(),
            RecipientId = request.RecipientUserId,
            Content = saved.Content,
            CreatedAt = saved.CreatedAt
        });
    }

    private static string BuildConversationId(int userIdA, int userIdB)
    {
        var min = Math.Min(userIdA, userIdB);
        var max = Math.Max(userIdA, userIdB);
        return $"conv-{min}-{max}";
    }

    private static (int userIdA, int userIdB)? ParseConversationId(string conversationId)
    {
        if (string.IsNullOrWhiteSpace(conversationId)) return null;
        var parts = conversationId.Split('-', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length != 3 || !parts[0].Equals("conv", StringComparison.OrdinalIgnoreCase)) return null;
        if (!int.TryParse(parts[1], out var userIdA)) return null;
        if (!int.TryParse(parts[2], out var userIdB)) return null;
        return (userIdA, userIdB);
    }
}
