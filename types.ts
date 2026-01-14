
export enum Role {
  USER = 'user',
  MODEL = 'model'
}

export interface Message {
  role: Role;
  text: string;
  timestamp: Date;
}

export type AIStyle = 'classic' | 'street' | 'executive' | 'counselor';

export interface StyleOption {
  id: AIStyle;
  label: string;
  icon: string;
  description: string;
}
