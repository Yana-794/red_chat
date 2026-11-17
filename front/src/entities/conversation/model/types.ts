export interface Conversation {
  id: string;
  kind: "public" | "direct";
  title: string;
  other_user_id?: string;
  other_username?: string;
  other_avatar_url?: string;
  last_message?: string;
  updated_at: string;
}
