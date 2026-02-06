import type { BaseEntity } from "./base";

export type Message = BaseEntity & {
  sender_user_id: string;
  recipient_user_id: string;
  content: string;
  read_at?: string | null;
};

export type NewMessageInput = {
  recipient_user_id: string;
  content: string;
};
