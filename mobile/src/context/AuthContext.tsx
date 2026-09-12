import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roles: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'user_token';
const USER_KEY = 'user_data';

const demoAccounts = [
  { id: 1, email: 'admin@agrimarket.com', password: 'admin123', firstName: 'Admin', lastName: 'User', phone: '+639123456789', roles: ['admin', 'buyer'] },
  { id: 2, email: 'seller@agrimarket.com', password: 'seller123', firstName: 'Maria', lastName: 'Santos', phone: '+639171112233', roles: ['seller', 'buyer'] },
  { id: 3, email: 'buyer@agrimarket.com', password: 'buyer123', firstName: 'Juan', lastName: 'Cruz', phone: '+639189998877', roles: ['buyer'] },
  { id: 4, email: 'driver@agrimarket.com', password: 'driver123', firstName: 'Rico', lastName: 'Driver', phone: '+639175551111', roles: ['delivery'] },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAuthData();
  }, []);

  const loadAuthData = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
      const storedUser = await SecureStore.getItemAsync(USER_KEY);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading auth data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const match = demoAccounts.find(
      (account) => account.email.toLowerCase() === email.trim().toLowerCase() && account.password === password
    );
    if (!match) {
      throw new Error('Unknown account. Try buyer@agrimarket.com / buyer123 or driver@agrimarket.com / driver123');
    }

    const nextUser: User = {
      id: match.id,
      email: match.email,
      firstName: match.firstName,
      lastName: match.lastName,
      phone: match.phone,
      roles: match.roles,
    };
    const mockToken = `demo-${match.id}`;

    setUser(nextUser);
    setToken(mockToken);

    await SecureStore.setItemAsync(TOKEN_KEY, mockToken);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(nextUser));
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  };

  const hasRole = (role: string): boolean => {
    return user?.roles.includes(role) || false;
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!user,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
