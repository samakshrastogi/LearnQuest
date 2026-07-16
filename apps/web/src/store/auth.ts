import { create } from 'zustand';
import { api } from '../utils/api.js';
import { UserDTO } from '@learnquest/shared-types';

interface AuthState {
  user: UserDTO | null;
  profile: any | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  onboarded: boolean;
  loading: boolean;
  error: string | null;
  login: (usernameOrEmail: string, password: string) => Promise<boolean>;
  register: (data: any) => Promise<boolean>;
  onboard: (data: any) => Promise<boolean>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  updateWallet: (currencies: { xp: number; coins: number; gems: number; energy: number }) => void;
  updateEquippedItems: (equipped: any) => void;
}

export const useAuthStore = create<AuthState>((set, get) => {
  // Listen for unauthorized logouts from API interceptor
  if (typeof window !== 'undefined') {
    window.addEventListener('unauthorized_logout', () => {
      set({ user: null, profile: null, accessToken: null, isAuthenticated: false, onboarded: false });
    });
  }

  return {
    user: null,
    profile: null,
    accessToken: null,
    isAuthenticated: false,
    onboarded: false,
    loading: false,
    error: null,

    login: async (usernameOrEmail, password) => {
      set({ loading: true, error: null });
      try {
        const response = await api.post('/auth/login', { usernameOrEmail, password });
        const { accessToken, user, profile, onboarded } = response.data.data;

        localStorage.setItem('accessToken', accessToken);
        set({
          user,
          profile,
          accessToken,
          isAuthenticated: true,
          onboarded,
          loading: false,
        });
        return true;
      } catch (err: any) {
        const errMsg = err.response?.data?.message || 'Login failed. Please try again.';
        set({ error: errMsg, loading: false });
        return false;
      }
    },

    register: async (data) => {
      set({ loading: true, error: null });
      try {
        const response = await api.post('/auth/register', data);
        const { accessToken, user } = response.data.data;

        localStorage.setItem('accessToken', accessToken);
        set({
          user,
          accessToken,
          isAuthenticated: true,
          onboarded: false,
          loading: false,
        });
        return true;
      } catch (err: any) {
        const errMsg = err.response?.data?.message || 'Registration failed.';
        set({ error: errMsg, loading: false });
        return false;
      }
    },

    onboard: async (data) => {
      set({ loading: true, error: null });
      try {
        const response = await api.post('/auth/onboard', data);
        const profile = response.data.data;
        set({
          profile,
          onboarded: true,
          loading: false,
        });
        return true;
      } catch (err: any) {
        const errMsg = err.response?.data?.message || 'Onboarding failed.';
        set({ error: errMsg, loading: false });
        return false;
      }
    },

    logout: async () => {
      try {
        await api.post('/auth/logout');
      } catch (err) {
        // Ignored
      }
      localStorage.removeItem('accessToken');
      set({
        user: null,
        profile: null,
        accessToken: null,
        isAuthenticated: false,
        onboarded: false,
      });
    },

    checkSession: async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      
      set({ loading: true });
      try {
        // Automatically check by rotating/fetching profile details
        const response = await api.get('/students/dashboard');
        const student = response.data.data.student;
        
        // Fetch current active user parameters from localStorage decoded or backend
        // Decoded token:
        const parts = token.split('.');
        const payload = JSON.parse(atob(parts[1]));
        
        set({
          user: {
            id: payload.id,
            username: payload.username,
            role: payload.role,
            isActive: true,
            isVerified: true,
            createdAt: '',
          },
          profile: student,
          accessToken: token,
          isAuthenticated: true,
          onboarded: true,
          loading: false,
        });
      } catch (err) {
        localStorage.removeItem('accessToken');
        set({ loading: false });
      }
    },

    updateWallet: (currencies) => {
      const profile = get().profile;
      if (!profile) return;
      set({
        profile: {
          ...profile,
          ...currencies,
        },
      });
    },

    updateEquippedItems: (equipped) => {
      const profile = get().profile;
      if (!profile) return;
      set({
        profile: {
          ...profile,
          selectedInventoryItems: equipped,
        },
      });
    },
  };
});
