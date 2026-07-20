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

// Helpers for localStorage persistence
const saveAuthState = (user: any, profile: any, accessToken: string, onboarded: boolean) => {
  if (typeof window === 'undefined') return;
  if (accessToken) localStorage.setItem('accessToken', accessToken);
  if (user) localStorage.setItem('user', JSON.stringify(user));
  if (profile) localStorage.setItem('profile', JSON.stringify(profile));
  localStorage.setItem('onboarded', JSON.stringify(onboarded));
};

const clearAuthState = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('user');
  localStorage.removeItem('profile');
  localStorage.removeItem('onboarded');
};

// Synchronously read initial state from localStorage so React Router never sees unauthenticated state on refresh!
const getInitialAuthState = () => {
  if (typeof window === 'undefined') {
    return { user: null, profile: null, accessToken: null, isAuthenticated: false, onboarded: false };
  }

  const token = localStorage.getItem('accessToken');
  const userStr = localStorage.getItem('user');
  const profileStr = localStorage.getItem('profile');
  const onboardedStr = localStorage.getItem('onboarded');

  if (token && userStr) {
    try {
      const user = JSON.parse(userStr);
      const profile = profileStr ? JSON.parse(profileStr) : null;
      const onboarded = onboardedStr ? JSON.parse(onboardedStr) : true;
      return {
        user,
        profile,
        accessToken: token,
        isAuthenticated: true,
        onboarded,
      };
    } catch (e) {
      // Ignored
    }
  }

  return { user: null, profile: null, accessToken: null, isAuthenticated: false, onboarded: false };
};

const initialAuth = getInitialAuthState();

export const useAuthStore = create<AuthState>((set, get) => {
  // Listen for unauthorized logouts from API interceptor
  if (typeof window !== 'undefined') {
    window.addEventListener('unauthorized_logout', () => {
      clearAuthState();
      set({ user: null, profile: null, accessToken: null, isAuthenticated: false, onboarded: false });
    });
  }

  return {
    user: initialAuth.user,
    profile: initialAuth.profile,
    accessToken: initialAuth.accessToken,
    isAuthenticated: initialAuth.isAuthenticated,
    onboarded: initialAuth.onboarded,
    loading: false,
    error: null,

    login: async (usernameOrEmail, password) => {
      set({ loading: true, error: null });
      try {
        const response = await api.post('/auth/login', { usernameOrEmail, password });
        const { accessToken, user, profile, onboarded } = response.data.data;

        saveAuthState(user, profile, accessToken, onboarded);
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
        let errMsg = 'Login failed. Please try again.';
        if (err.response?.data) {
          const data = err.response.data;
          if (data.errors && Array.isArray(data.errors)) {
            errMsg = data.errors.map((e: any) => e.message).join(', ');
          } else {
            errMsg = data.message || errMsg;
          }
        }
        set({ error: errMsg, loading: false });
        return false;
      }
    },

    register: async (data) => {
      set({ loading: true, error: null });
      try {
        const response = await api.post('/auth/register', data);
        const { accessToken, user } = response.data.data;

        saveAuthState(user, null, accessToken, false);
        set({
          user,
          accessToken,
          isAuthenticated: true,
          onboarded: false,
          loading: false,
        });
        return true;
      } catch (err: any) {
        let errMsg = 'Registration failed.';
        if (err.response?.data) {
          const data = err.response.data;
          if (data.errors && Array.isArray(data.errors)) {
            errMsg = data.errors.map((e: any) => e.message).join(', ');
          } else {
            errMsg = data.message || errMsg;
          }
        }
        set({ error: errMsg, loading: false });
        return false;
      }
    },

    onboard: async (data) => {
      set({ loading: true, error: null });
      try {
        const response = await api.post('/auth/onboard', data);
        const profile = response.data.data;
        const currentToken = get().accessToken || localStorage.getItem('accessToken') || '';
        const currentUser = get().user;

        saveAuthState(currentUser, profile, currentToken, true);
        set({
          profile,
          onboarded: true,
          loading: false,
        });
        return true;
      } catch (err: any) {
        let errMsg = 'Onboarding failed.';
        if (err.response?.data) {
          const data = err.response.data;
          if (data.errors && Array.isArray(data.errors)) {
            errMsg = data.errors.map((e: any) => e.message).join(', ');
          } else {
            errMsg = data.message || errMsg;
          }
        }
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
      clearAuthState();
      set({
        user: null,
        profile: null,
        accessToken: null,
        isAuthenticated: false,
        onboarded: false,
      });
    },

    checkSession: async () => {
      if (typeof window === 'undefined') return;

      const token = localStorage.getItem('accessToken');
      const userStr = localStorage.getItem('user');
      const profileStr = localStorage.getItem('profile');
      const onboardedStr = localStorage.getItem('onboarded');

      if (!token || !userStr) {
        set({ loading: false });
        return;
      }

      try {
        const savedUser = JSON.parse(userStr);
        const savedProfile = profileStr ? JSON.parse(profileStr) : null;
        const savedOnboarded = onboardedStr ? JSON.parse(onboardedStr) : true;

        // Ensure session is synchronized
        set({
          user: savedUser,
          profile: savedProfile,
          accessToken: token,
          isAuthenticated: true,
          onboarded: savedOnboarded,
          loading: false,
        });

        // Background non-blocking session verification / token rotation
        try {
          const res = await api.post('/auth/refresh');
          const newAccessToken = res.data.data?.accessToken;
          if (newAccessToken) {
            localStorage.setItem('accessToken', newAccessToken);
            set({ accessToken: newAccessToken });
          }
        } catch (refreshErr: any) {
          if (refreshErr.response?.status === 401) {
            clearAuthState();
            set({ user: null, profile: null, accessToken: null, isAuthenticated: false, onboarded: false });
          }
        }
      } catch (err) {
        clearAuthState();
        set({ user: null, profile: null, accessToken: null, isAuthenticated: false, onboarded: false, loading: false });
      }
    },

    updateWallet: (currencies) => {
      const profile = get().profile;
      if (!profile) return;
      const updatedProfile = {
        ...profile,
        ...currencies,
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('profile', JSON.stringify(updatedProfile));
      }
      set({ profile: updatedProfile });
    },

    updateEquippedItems: (equipped) => {
      const profile = get().profile;
      if (!profile) return;
      const updatedProfile = {
        ...profile,
        selectedInventoryItems: equipped,
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('profile', JSON.stringify(updatedProfile));
      }
      set({ profile: updatedProfile });
    },
  };
});
