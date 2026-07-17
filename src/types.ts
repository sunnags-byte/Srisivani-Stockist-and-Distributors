export interface Store {
  id: string;
  name: string;
  address: string;
  phone: string;
  isMobile: boolean;
  hours: string;
  flagSuspicious?: boolean;
  notes?: string;
  crmStatus?: 'None' | 'Messaged' | 'Interested' | 'Not Interested' | 'Completed';
  lastMessagedAt?: string;
  isCustom?: boolean;
  customMessage?: string;
}

export type VibeType = 'warm_friendly' | 'professional' | 'value_focused' | 'concise' | 'malayalam_english';

export interface VibeConfig {
  id: VibeType;
  label: string;
  description: string;
  emoji: string;
}

export interface CustomLeadInput {
  name: string;
  phone: string;
  address: string;
  hours: string;
  notes?: string;
}
