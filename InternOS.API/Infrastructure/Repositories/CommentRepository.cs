using InternOS.API.Domain.Entities;
using InternOS.API.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

public class CommentRepository : ICommentRepository
{
    private readonly AppDbContext _context;
    public CommentRepository(AppDbContext context) => _context = context;

    public async Task AddCommentAsync(Comment comment)
    {
        _context.Comments.Add(comment);
        await _context.SaveChangesAsync();
    }

    public async Task<IEnumerable<Comment>> GetCommentsByTaskIdAsync(int taskId)
    {
        return await _context.Comments
            .Include(c => c.User)
            .Where(c => c.TaskId == taskId)
            .OrderBy(c => c.CreatedAt)
            .ToListAsync();
    }
}