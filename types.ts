export enum Role {
  USER = 'user',
  MODEL = 'model',
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  timestamp: Date;
  attachment?: string; // base64 string for images
  isAudioPlaying?: boolean;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

export enum TTSVoice {
  Kore = 'Kore',
  Puck = 'Puck',
  Charon = 'Charon',
  Fenrir = 'Fenrir',
  Zephyr = 'Zephyr',
}

export enum DataType {
  BLOOD = 'Blood Test',
  URINE = 'Urine Test',
  PULSE = 'Pulse Rate',
  STOOL = 'Stool Test',
}

export type Language = 'en' | 'zh';
