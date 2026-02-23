using InternOS.API.Domain.Entities;
using InternOS.API.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InternOS.API.Infrastructure.Repositories;

public class MessageRepository : IMessageRepository
{
    private readonly AppDbContext _context;

    public MessageRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<Message>> GetMessagesForUserAsync(int userId)
    {
        return await _context.Messages
            .Include(m => m.SenderUser)
            .Include(m => m.RecipientUser)
            .Where(m => m.SenderUserId == userId || m.RecipientUserId == userId)
            .OrderByDescending(m => m.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<Message>> GetMessagesForConversationAsync(int userIdA, int userIdB)
    {
        return await _context.Messages
            .Include(m => m.SenderUser)
            .Include(m => m.RecipientUser)
            .Where(m =>
                (m.SenderUserId == userIdA && m.RecipientUserId == userIdB) ||
                (m.SenderUserId == userIdB && m.RecipientUserId == userIdA))
            .OrderBy(m => m.CreatedAt)
            .ToListAsync();
    }

    public async Task<Message> AddMessageAsync(Message message)
    {
        _context.Messages.Add(message);
        await _context.SaveChangesAsync();
        return message;
    }
}
