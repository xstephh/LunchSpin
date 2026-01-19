import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, AppData } from '../types';
import { getUserData } from '../services/storageService';

interface AuthContextType {
  user: UserProfile | null;
  userData: AppData | null;
  login: (email: string, name: string) => void;
  logout: () => void;
  refreshData: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userData, setUserData] = useState<AppData | null>(null);

  useEffect(() => {
    // Check local storage for existing session
    const storedUser = localStorage.getItem('lunchspin_current_user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setUserData(getUserData(parsedUser.id));
    }
  }, []);

  const login = (email: string, name: string) => {
    // Sanitize input to ensure case-insensitive matching
    const cleanEmail = email.trim().toLowerCase();
    
    // Create a deterministic ID based on the email.
    // In a real backend, this would be a UUID from the database.
    // Here, we use this to partition LocalStorage data per user.
    const id = btoa(cleanEmail).substring(0, 12); 
    
    const newUser: UserProfile = { id, email: cleanEmail, name: name.trim() };
    
    setUser(newUser);
    // Persist the *session*
    localStorage.setItem('lunchspin_current_user', JSON.stringify(newUser));
    // Load the *data* associated with this ID
    setUserData(getUserData(id));
  };

  const logout = () => {
    setUser(null);
    setUserData(null);
    localStorage.removeItem('lunchspin_current_user');
  };

  const refreshData = () => {
    if (user) {
      setUserData(getUserData(user.id));
    }
  };

  return (
    <AuthContext.Provider value={{ user, userData, login, logout, refreshData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};