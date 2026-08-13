export type WorkspaceRole = 'admin' | 'member' | 'guest';

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  role: WorkspaceRole;
}

export interface Team {
  _id: string;
  workspaceId: string;
  name: string;
  description?: string;
  memberIds: string[];
}

export interface Board {
  _id: string;
  workspaceId: string;
  teamId?: string | null;
  name: string;
  description?: string;
  columns: string[];
  createdAt?: string;
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  _id: string;
  workspaceId: string;
  boardId: string;
  title: string;
  description: string;
  status: string;
  priority: TaskPriority;
  assigneeIds: string[];
  position: number;
  dueDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserPresence {
  userId: string;
  fullName: string;
  email: string;
  online: boolean;
  x?: number;
  y?: number;
  lastSeen?: string;
}
