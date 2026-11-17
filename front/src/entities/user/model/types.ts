export interface User {
  id: string;
  username: string;
  description: string;
  avatar_url: string;
  created_at: string;
}

export interface UserSummary {
  id: string;
  username: string;
  avatar_url: string;
}

export interface AuthPayload {
  user: User;
  csrf_token: string;
}
