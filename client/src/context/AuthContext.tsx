import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Workspace } from '../types';
import { api, setAccessToken, setActiveWorkspaceId } from '../services/api';

interface AuthContextType {
  user: User | null;
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string, workspaceName?: string, inviteSlug?: string) => Promise<void>;
  logout: () => Promise<void>;
  switchWorkspace: (workspaceId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspaceState] = useState<Workspace | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const updateSession = (newUser: User | null, newWorkspaces: Workspace[], token: string | null, activeWs?: Workspace | null) => {
    setUser(newUser);
    setWorkspaces(newWorkspaces);
    setAccessTokenState(token);
    setAccessToken(token);

    const selectedWs = activeWs || newWorkspaces[0] || null;
    setActiveWorkspaceState(selectedWs);
    setActiveWorkspaceId(selectedWs ? selectedWs.id : null);
  };

  // Attempt initial silent token refresh on page mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data } = await api.post('/auth/refresh');
        setAccessTokenState(data.accessToken);
        setAccessToken(data.accessToken);
        // Note: workspace & user context can be populated on subsequent fetch
      } catch (err) {
        // Unauthenticated visitor
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    updateSession(data.user, data.workspaces, data.accessToken);
  };

  const register = async (fullName: string, email: string, password: string, workspaceName?: string, inviteSlug?: string) => {
    const { data } = await api.post('/auth/register', { fullName, email, password, workspaceName, inviteSlug });
    const wsList = [data.workspace];
    updateSession(data.user, wsList, data.accessToken, data.workspace);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore error during logout
    } finally {
      updateSession(null, [], null);
    }
  };

  const switchWorkspace = (workspaceId: string) => {
    const target = workspaces.find((w) => w.id === workspaceId);
    if (target) {
      setActiveWorkspaceState(target);
      setActiveWorkspaceId(target.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        workspaces,
        activeWorkspace,
        accessToken,
        loading,
        login,
        register,
        logout,
        switchWorkspace
      }}
    >
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
