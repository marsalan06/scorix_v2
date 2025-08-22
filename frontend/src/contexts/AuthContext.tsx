import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { User, UserLogin, UserUpdate } from '../types';

interface LoginResult {
  success: boolean;
  shouldRedirectToRegister?: boolean;
  message?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: UserLogin) => Promise<LoginResult>;
  register: (userData: any) => Promise<boolean>;
  logout: () => void;
  updateProfile: (profileData: UserUpdate) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const clearAuth = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
  }, []);

  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await api.get('/users/profile');
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      clearAuth();
    } finally {
      setLoading(false);
    }
  }, [clearAuth]);

  const logout = useCallback(() => {
    clearAuth();
    toast.success('Logged out successfully');
  }, [clearAuth]);

  useEffect(() => {
    if (token) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, [token, fetchUserProfile]);

  const login = async (credentials: UserLogin): Promise<LoginResult> => {
    try {
      const response = await api.post('/auth/login', credentials);
      const { access_token } = response.data;
      
      setToken(access_token);
      localStorage.setItem('token', access_token);
      
      // Set the token in axios headers
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      await fetchUserProfile();
      toast.success('Login successful!');
      return { success: true };
    } catch (error: any) {
      const message = error.response?.data?.detail || error.response?.data?.message || 'Login failed';
      const status = error.response?.status;
      
      // For login failures, redirect to register for all 401 errors
      if (status === 401) {
        return { 
          success: false, 
          shouldRedirectToRegister: true, 
          message: 'Invalid credentials. Please check your username and password, or create a new account.' 
        };
      }
      
      // For other errors, show the error message
      toast.error(message);
      return { success: false, message };
    }
  };

  const register = async (userData: any): Promise<boolean> => {
    try {
      await api.post('/auth/register', userData);
      toast.success('Registration successful! Please login.');
      return true;
    } catch (error: any) {
      const message = error.response?.data?.detail || error.response?.data?.message || 'Registration failed';
      toast.error(message);
      return false;
    }
  };

  const updateProfile = async (profileData: UserUpdate): Promise<boolean> => {
    try {
      await api.patch('/users/profile', profileData);
      await fetchUserProfile();
      toast.success('Profile updated successfully!');
      return true;
    } catch (error: any) {
      const message = error.response?.data?.error?.message || 'Profile update failed';
      toast.error(message);
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
