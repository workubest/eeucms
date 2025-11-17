import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '@/types';
import { demoUsers, demoCredentials } from './demo-data';
import { supabase, isSupabaseAvailable } from '@/integrations/supabase/client';
import { checkBackendHealth } from './supabase-health';
import { gasApi } from './gas-client';

interface AuthContextType {
  user: User | null;
  userRole: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
  isBackendOnline: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBackendOnline, setIsBackendOnline] = useState(false);

  useEffect(() => {
    // Check backend health
    if (isSupabaseAvailable) {
      checkBackendHealth().then(result => {
        setIsBackendOnline(result.isHealthy);
      });
    } else {
      setIsBackendOnline(false);
    }

    // Check for Supabase session first (only if available)
    if (isSupabaseAvailable) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          // Load user profile from Supabase
          loadUserProfile(session.user.id);
        }
        setIsLoading(false);
      });

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          loadUserProfile(session.user.id);
        } else {
          setUser(null);
        }
      });

      return () => subscription.unsubscribe();
    } else {
      setIsLoading(false);
    }
  }, []);

  const loadUserProfile = async (userId: string) => {
    if (!isSupabaseAvailable) {
      // If Supabase is not available, user profile should be loaded from localStorage or demo data
      const storedUser = localStorage.getItem('eeu_user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
        } catch (error) {
          console.error('Error parsing stored user data:', error);
        }
      }
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profile) {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      setUser({
        id: profile.id,
        email: profile.email,
        name: profile.full_name || profile.email,
        role: roleData?.role || 'staff',
        active: true,
        createdAt: profile.created_at
      });
    }
  };

  const login = async (email: string, password: string) => {
    // Check if using demo credentials
    const isValidAdmin = email === demoCredentials.admin.email && password === demoCredentials.admin.password;
    const isValidStaff = email === demoCredentials.staff.email && password === demoCredentials.staff.password;
    const isValidManager = email === demoCredentials.manager.email && password === demoCredentials.manager.password;

    // Try proxy server (which connects to GAS backend)
    try {
      console.log('Trying proxy server login...');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim(), password: password.trim() })
      });

      const responseData = await response.json();

      if (response.ok && responseData.success && responseData.user) {
        const userData = responseData.user;
        const user: User = {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          region: userData.region,
          serviceCenter: userData.service_center,
          active: true,
          createdAt: new Date().toISOString()
        };
        setUser(user);
        localStorage.setItem('eeu_user', JSON.stringify(user));
        return { success: true };
      } else {
        throw new Error(responseData.error || 'Authentication failed');
      }
    } catch (proxyError) {
      console.log('Proxy server login failed, trying Supabase...', proxyError);
    }

    // Try Supabase auth if backend is online and available
    if (isBackendOnline && isSupabaseAvailable) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (data.user) {
        await loadUserProfile(data.user.id);
        return { success: true };
      }

      // If it's a demo credential and user doesn't exist, create it
      if (error?.message.includes('Invalid') && (isValidAdmin || isValidStaff || isValidManager)) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: {
              full_name: isValidAdmin ? 'Admin User' : isValidStaff ? 'Staff User' : 'Manager User'
            }
          }
        });

        if (signUpData.user) {
          // Set the appropriate role
          const role = isValidAdmin ? 'admin' : isValidStaff ? 'staff' : 'manager';
          await supabase.from('user_roles').insert({
            user_id: signUpData.user.id,
            role: role
          });

          await loadUserProfile(signUpData.user.id);
          return { success: true };
        }

        if (signUpError) {
          console.error('Auto-signup failed:', signUpError);
        }
      }

      if (error) {
        return { success: false, error: error.message };
      }
    }

    return { success: false, error: 'Authentication failed. Please check your credentials and ensure the backend is available.' };
  };

  const logout = () => {
    if (isSupabaseAvailable) {
      supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem('eeu_user');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userRole: user?.role || null, 
      isAuthenticated: !!user, 
      login, 
      logout, 
      isLoading,
      isBackendOnline 
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
