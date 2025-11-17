import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '@/types';
import { gasApi } from './gas-client';

interface AuthContextType {
  user: User | null;
  userRole: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('eeu_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('eeu_user');
      }
    }
    setIsLoading(false);
  }, []);


  const login = async (email: string, password: string) => {
    // Authenticate against Google Sheets data via GAS
    try {
      console.log('🔐 Authenticating with Google Sheets...');
      const response = await gasApi.login(email.trim(), password.trim());

      if (response.success && response.data?.user) {
        const userData = response.data.user;
        const user: User = {
          id: userData.id || userData.ID,
          email: userData.email || userData.Email,
          name: userData.name || userData.Name || userData.email,
          role: userData.role || userData.Role || 'staff',
          region: userData.region || userData.Region || 'Addis Ababa',
          serviceCenter: userData.serviceCenter || userData['Service Center'] || 'Main Office',
          active: userData.active !== false,
          createdAt: userData.createdAt || userData['Created At'] || new Date().toISOString()
        };

        setUser(user);
        localStorage.setItem('eeu_user', JSON.stringify(user));
        console.log('✅ Authentication successful:', user.name);
        return { success: true };
      } else {
        throw new Error(response.error || 'Invalid credentials');
      }
    } catch (gasError) {
      console.error('❌ GAS authentication failed:', gasError);
      return { success: false, error: gasError.message || 'Authentication failed. Please check your credentials.' };
    }

    // If GAS authentication fails, return the error
    return { success: false, error: 'Authentication failed. Please check your credentials.' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('eeu_user');
    console.log('👋 User logged out successfully');
  };

  return (
    <AuthContext.Provider value={{
      user,
      userRole: user?.role || null,
      isAuthenticated: !!user,
      login,
      logout,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
