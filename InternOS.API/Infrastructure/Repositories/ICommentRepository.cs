using InternOS.API.Domain.Entities;

public interface ICommentRepository
{
    Task AddCommentAsync(Comment comment);
    Task<IEnumerable<Comment>> GetCommentsByTaskIdAsync(int taskId);
}