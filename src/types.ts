export interface PublicState {
  question: string;
  isOpen: boolean;
  words: Record<string, number>;
  totalSubmissions: number;
  uniqueWords: number;
  activeParticipants: number;
  recentSubmissions: Array<{
    id: string;
    word: string;
    timestamp: number;
  }>;
}

export type ViewMode = 'participant' | 'display' | 'admin';
