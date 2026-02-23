export interface ITask {
  id: number;
  title: string;
  description: string;
  status: string;
  assignedToUserId?: number;
  createdByUserId?: number;
  createdAt: Date;
  completedAt?: Date;
  commentCount?: number;
  latestComment?: string;
}

export interface ICreateTaskRequest {
  title: string;
  description: string;
  assignedToUserId: number;
}

export interface IUpdateTaskStatusRequest {
  status: number; // 0 = Pending, 1 = InProgress, 2 = Completed
}

export interface IComment {
  id: number;
  content: string;
  createdAt: Date;
  userName: string;
}

export interface ICreateCommentRequest {
  taskId: number;
  content: string;
}

export interface ITaskSubmission {
  fileName: string;
  fileUrl: string;
  sizeBytes: number;
  uploadedAt: Date;
}
