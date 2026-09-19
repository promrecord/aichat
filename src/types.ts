export interface HistoricalCharacter {
  id: string;
  name: string;
  koreanName: string;
  title: string;
  era: string;
  lifespan: string;
  tagline: string;
  bio: string;
  costumeName: string;
  costumeDescription: string;
  accentColor: string;
  badgeBg: string;
  defaultAvatar: string;
  systemInstruction: string;
  voiceName: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';
  suggestedQuestions: string[];
  historicalAchievements: string[];
  quote: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: number;
  characterId?: string;
  characterName?: string;
  avatarUrl?: string;
  audioBase64?: string;
  audioMimeType?: string;
  isAudioPlaying?: boolean;
}

export interface GeneratedCostumeResult {
  characterId: string;
  imageUrl: string;
  celebrityName?: string;
  generatedAt: number;
}

export interface CelebrityPreset {
  id: string;
  name: string;
  role: string;
  imageUrl: string;
}
