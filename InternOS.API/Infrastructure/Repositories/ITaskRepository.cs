using InternOS.API.Application.DTOs;
using InternOS.API.Domain.Entities;

namespace InternOS.API.Infrastructure.Repositories;

public interface ITaskRepository
{
    Task<IEnumerable<UserTask>> GetAllTasksAsync();
    Task<IEnumerable<UserTask>> GetTasksByUserIdAsync(int userId);
    Task<UserTask?> GetTaskByIdAsync(int id);
    Task<UserTask> CreateTaskAsync(UserTask task);
    Task UpdateTaskAsync(UserTask task);
    Task DeleteTaskAsync(UserTask task);
    Task<DashboardStatsDto> GetDashboardStatsAsync();
}
