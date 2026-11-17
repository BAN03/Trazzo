import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  LOCAL_USER_EMAIL,
  LOCAL_USER_ID,
  getStoredLocalUser,
  initDatabase,
  mergeLocalUserInto,
  resetUserProfile,
  upsertUser,
} from '../utils/database';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  photo?: string;
  businessName?: string;
  businessType?: string;
  onboardingCompleted: boolean;
}

export interface GoogleProfile {
  id?: string;
  name?: string | null;
  email?: string | null;
  photo?: string | null;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  loginWithGoogle: (idToken: string | null, profile?: GoogleProfile) => Promise<void>;
  registerWithGoogle: (idToken: string | null, profile?: GoogleProfile) => Promise<void>;
  continueAsLocal: () => void;
  logout: () => void;
  completeOnboarding: (data: { name: string; businessName: string; businessType: string }) => void;
  updateUser: (data: Partial<AuthUser>) => void;
  setHasHydrated: (value: boolean) => void;
}

const toDbUser = (user: AuthUser) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  photo: user.photo ?? null,
  business_name: user.businessName ?? null,
  business_type: user.businessType ?? null,
  onboarding_completed: user.onboardingCompleted,
});

const saveUser = (user: AuthUser) => {
  initDatabase();
  upsertUser(toDbUser(user));
};

const createLocalUser = (): AuthUser => ({
  id: LOCAL_USER_ID,
  name: 'Usuario',
  email: LOCAL_USER_EMAIL,
  onboardingCompleted: false,
});

/** Decodifica el payload de un JWT sin validar la firma (solo para datos de perfil). */
const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const decoded =
      typeof globalThis.atob === 'function'
        ? globalThis.atob(padded)
        : '';
    if (!decoded) return null;
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const googleUserFromToken = (
  idToken: string | null,
  fallbackName: string,
  profile?: GoogleProfile
): AuthUser => {
  const payload = idToken ? decodeJwtPayload(idToken) : null;
  const subject =
    (typeof payload?.sub === 'string' && payload.sub) || profile?.id || '';
  const email =
    (typeof payload?.email === 'string' && payload.email) || profile?.email || '';
  const name =
    (typeof payload?.name === 'string' && payload.name) || profile?.name || '';
  const picture =
    (typeof payload?.picture === 'string' && payload.picture) ||
    profile?.photo ||
    undefined;
  const stableId = subject || email || `google_${Date.now()}`;

  return {
    id: `google_${stableId}`,
    name: name || fallbackName,
    email: email || `${stableId}@trazzo.app`,
    photo: picture,
    onboardingCompleted: false,
  };
};

const signIn = (user: AuthUser): AuthUser => {
  saveUser(user);

  // Si se había usado el modo local, conserva esos datos al entrar con Google.
  if (user.id !== LOCAL_USER_ID) {
    const migrated = mergeLocalUserInto(user.id);
    if (migrated) {
      return {
        ...user,
        businessName: user.businessName ?? migrated.businessName ?? undefined,
        businessType: user.businessType ?? migrated.businessType ?? undefined,
        onboardingCompleted: user.onboardingCompleted || migrated.onboardingCompleted,
      };
    }
  }

  return user;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      hasHydrated: false,

      loginWithGoogle: async (idToken, profile) => {
        const current = get().user;
        const user = signIn(
          current?.onboardingCompleted && current.id.startsWith('google_')
            ? {
                ...googleUserFromToken(idToken, current.name, profile),
                onboardingCompleted: true,
              }
            : googleUserFromToken(idToken, 'Usuario de Google', profile)
        );
        set({ user, isAuthenticated: true });
      },

      registerWithGoogle: async (idToken, profile) => {
        const user = signIn(googleUserFromToken(idToken, 'Nuevo usuario', profile));
        set({ user, isAuthenticated: true });
      },

      continueAsLocal: () => {
        const current = get().user;
        if (current) {
          set({ isAuthenticated: true });
          return;
        }

        // Recupera el perfil que ya se había capturado en este dispositivo
        // para no pedir el tour ni borrar el nombre del negocio.
        const stored = getStoredLocalUser();
        const user = signIn(
          stored
            ? { id: LOCAL_USER_ID, ...stored }
            : createLocalUser()
        );
        set({ user, isAuthenticated: true });
      },

      logout: () => {
        const current = get().user;
        if (current) {
          resetUserProfile(current.id);
          if (current.id !== LOCAL_USER_ID) {
            resetUserProfile(LOCAL_USER_ID);
          }
        }
        set({ user: null, isAuthenticated: false });
      },

      completeOnboarding: (data) => {
        const current = get().user ?? createLocalUser();
        const user: AuthUser = {
          ...current,
          name: data.name.trim(),
          businessName: data.businessName.trim(),
          businessType: data.businessType,
          onboardingCompleted: true,
        };
        saveUser(user);
        set({ user, isAuthenticated: true });
      },

      updateUser: (data) => {
        const current = get().user ?? createLocalUser();
        const user: AuthUser = { ...current, ...data };
        saveUser(user);
        set({ user, isAuthenticated: true });
      },

      setHasHydrated: (value) => {
        set({ hasHydrated: value });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
