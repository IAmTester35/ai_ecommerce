import { CarResponse, ExtractedConstraints, SearchProgressEvent } from './index';

export type MessageRole = 'user' | 'assistant' | 'system';

export interface UIChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  conflictDetected?: boolean;
  relaxedTerms?: string[];
  suggestedCars?: CarResponse[];
  extractedConstraints?: ExtractedConstraints;
  isStreaming?: boolean;
  progress?: SearchProgressEvent;
}

export interface QuickPrompt {
  id: string;
  icon: string;
  title: string;
  prompt: string;
}
