export interface Restaurant {
  id: string;
  name: string;
  cuisine?: string;
  rating?: number;
  priceLevel?: string; // $, $$, $$$
  address?: string;
  googleMapsUri?: string;
  imageUrl?: string;
  userNotes?: string;
  source: 'manual' | 'google';
}

export interface SavedList {
  id: string;
  name: string;
  restaurants: Restaurant[];
  isDefault?: boolean;
}

export interface HistoryEntry {
  id: string;
  date: string; // ISO string
  restaurantId: string;
  restaurantName: string;
  cuisine: string;
}

export enum AppView {
  LOGIN = 'LOGIN',
  PICKER = 'PICKER',
  DISCOVERY = 'DISCOVERY',
  LISTS = 'LISTS',
  STATS = 'STATS',
  SETTINGS = 'SETTINGS'
}

export interface UserStats {
  totalPicks: number;
  topCuisine: string;
  recentActivity: number[]; // Counts per day
}

export type Language = 'en' | 'zh-TW';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface AppData {
  lists: SavedList[];
  history: HistoryEntry[];
  cuisines: string[];
}
