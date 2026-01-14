
export enum Role {
  USER = 'user',
  MODEL = 'model'
}

export interface Message {
  role: Role;
  text: string;
  timestamp: Date;
}

export type ConversationStyle = 'casual' | 'formal' | 'church' | 'general';
