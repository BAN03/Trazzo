import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  name: string;
  email: string;
  photo?: string;
  businessName?: string;
  businessType?: string;
  onboardingCompleted: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loginWithGoogle: (idToken: string) => Promise<void>;
  registerWithGoogle: (idToken: string) => Promise<void>;
  logout: () => void;
  completeOnboarding: (data: { name: string; businessName: string; businessType: string }) => void;
  updateUser: (data: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      loginWithGoogle: async (idToken: string) => {
        // En producción, validar el idToken con el backend
        // Por ahora, simulamos un usuario
        const mockUser: User = {
          id: 'google_' + Date.now(),
          name: 'Usuario Demo',
          email: 'demo@example.com',
          onboardingCompleted: false,
        };
        set({ user: mockUser, isAuthenticated: true });
      },

      registerWithGoogle: async (idToken: string) => {
        // En producción, validar el idToken con el backend
        const mockUser: User = {
          id: 'google_' + Date.now(),
          name: 'Nuevo Usuario',
          email: 'nuevo@example.com',
          onboardingCompleted: false,
        };
        set({ user: mockUser, isAuthenticated: true });
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },

      completeOnboarding: (data) => {
        set((state) => ({
          user: state.user
            ? { ...state.user, ...data, onboardingCompleted: true }
            : null,
        }));
      },

      updateUser: (data) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        }));
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);