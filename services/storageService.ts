import { SavedList, HistoryEntry, AppData, Restaurant } from '../types';
import { INITIAL_LISTS, DEFAULT_CUISINES } from '../constants';

const DATA_PREFIX = 'lunchspin_data_';

const getStorageKey = (userId: string) => `${DATA_PREFIX}${userId}`;

export const getUserData = (userId: string): AppData => {
  try {
    const data = localStorage.getItem(getStorageKey(userId));
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Failed to load user data", e);
  }
  
  // Return deep copy of defaults to ensure no reference sharing between users
  // or mutations of the constant if the page isn't reloaded
  return {
    lists: JSON.parse(JSON.stringify(INITIAL_LISTS)),
    history: [],
    cuisines: [...DEFAULT_CUISINES]
  };
};

export const saveUserData = (userId: string, data: AppData) => {
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save user data - likely quota exceeded", e);
  }
};

// Helper to update specific parts
export const updateLists = (userId: string, lists: SavedList[]) => {
  const data = getUserData(userId);
  data.lists = lists;
  saveUserData(userId, data);
};

export const addToHistory = (userId: string, entry: HistoryEntry) => {
  const data = getUserData(userId);
  data.history = [entry, ...data.history].slice(0, 100);
  saveUserData(userId, data);
};

export const updateCuisines = (userId: string, cuisines: string[]) => {
  const data = getUserData(userId);
  data.cuisines = cuisines;
  saveUserData(userId, data);
};

// Returns true if added, false if removed
export const toggleFavorite = (userId: string, restaurant: Restaurant): boolean => {
  const data = getUserData(userId);
  const FAVORITES_ID = 'favorites-list';
  
  let favList = data.lists.find(l => l.id === FAVORITES_ID);
  
  if (!favList) {
    favList = {
      id: FAVORITES_ID,
      name: 'Favorites',
      restaurants: [],
      isDefault: false
    };
    // Insert after the first list (usually default)
    data.lists.splice(1, 0, favList);
  }

  // Check if exists (by name to avoid duplicates if ID varies)
  const existingIndex = favList.restaurants.findIndex(r => r.name === restaurant.name);
  
  let isAdded = false;
  if (existingIndex >= 0) {
    // Remove
    favList.restaurants.splice(existingIndex, 1);
  } else {
    // Add
    const entry = { ...restaurant, id: `fav-${Date.now()}` }; 
    favList.restaurants.push(entry);
    isAdded = true;
  }
  
  saveUserData(userId, data);
  return isAdded;
};