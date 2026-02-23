using InternOS.API.Domain.Entities;

namespace InternOS.API.Infrastructure.Repositories;

public interface IMessageRepository
{
    Task<List<Message>> GetMessagesForUserAsync(int userId);
    Task<List<Message>> GetMessagesForConversationAsync(int userIdA, int userIdB);
    Task<Message> AddMessageAsync(Message message);
}
