export const UserRole = {
  Admin: 0,
  Mentor: 1,
  Intern: 2,
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const TaskStatus = {
  Pending: 0,
  InProgress: 1,
  Completed: 2,
  Submitted: 3,
} as const;

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];
