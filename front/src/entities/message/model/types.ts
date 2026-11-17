export interface Attachment {
  id: string;
  original_name: string;
  url: string;
  mime_type: string;
  size_bytes: number;
}

export interface Reaction {
  emoji: string;
  count: number;
  reacted_by_me: boolean;
}

export interface Message {
  id: number;
  conversation_id: string;
  sender_id: string;
  username: string;
  avatar_url: string;
  content: string;
  created_at: string;
  edited_at?: string | null;
  attachments: Attachment[];
  reactions: Reaction[];
}

export interface MessagesPage {
  items: Message[];
  has_more: boolean;
  next_before_id: number | null;
}
