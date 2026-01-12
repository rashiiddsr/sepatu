import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, type AuthUser } from '../lib/api';
import type { Profile } from '../types/database';

interface AuthContextType {
  user: AuthUser | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (identifier: string, password: string) => Promise<{ user: AuthUser; profile: Profile }>;
  signUp: (email: string, password: string, fullName: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: () => boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSession = async () => {
    const session = await api.getSession();
    if (session) {
      setUser(session.user);
      setProfile(session.profile);
    } else {
      setUser(null);
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    const profileData = await api.getProfile();
    setProfile(profileData);
  };

  useEffect(() => {
    fetchSession()
      .catch(() => {
        setUser(null);
        setProfile(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const signIn = async (identifier: string, password: string) => {
    const session = await api.signIn(identifier, password);
    setUser(session.user);
    setProfile(session.profile);
    return session;
  };

  const signUp = async (email: string, password: string, fullName: string, username: string) => {
    const session = await api.signUp(email, password, fullName, username);
    setUser(session.user);
    setProfile(session.profile);
  };

  const signOut = async () => {
    await api.signOut();
    setUser(null);
    setProfile(null);
  };

  const isAdmin = () => {
    return profile?.role === 'admin' || profile?.role === 'super_admin';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        isAdmin,
        refreshProfile,
      }}
    >
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
