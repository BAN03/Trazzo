import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useAuthStore } from '../hooks/useAuthStore';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID?.trim() ?? '';
const IS_GOOGLE_CONFIGURED =
  GOOGLE_CLIENT_ID.length > 0 && !GOOGLE_CLIENT_ID.startsWith('YOUR_GOOGLE');
const REDIRECT_URI = AuthSession.makeRedirectUri({ scheme: 'trazzo' });

// Endpoints fijos para no depender de una descarga de descubrimiento al abrir.
const discovery: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

interface AuthScreenProps {
  mode: 'login' | 'register';
}

export function AuthScreen({ mode }: AuthScreenProps) {
  const isLogin = mode === 'login';
  const { user, hasHydrated, loginWithGoogle, registerWithGoogle, continueAsLocal } =
    useAuthStore();
  const [loading, setLoading] = useState(false);

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_CLIENT_ID || 'not-configured.apps.googleusercontent.com',
      redirectUri: REDIRECT_URI,
      scopes: ['openid', 'profile', 'email'],
      responseType: AuthSession.ResponseType.IdToken,
    },
    discovery
  );

  const goToNextStep = () => {
    const current = useAuthStore.getState().user;
    router.replace(current?.onboardingCompleted ? '/home' : '/welcome');
  };

  useEffect(() => {
    if (hasHydrated && user) {
      goToNextStep();
    }
    // Solo al montar o cuando cambia la sesión.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated, user?.id, user?.onboardingCompleted]);

  useEffect(() => {
    if (response?.type === 'success') {
      const idToken = response.params['id_token'];
      if (!idToken) {
        setLoading(false);
        Alert.alert('Error', 'Google no devolvió la información de la cuenta.');
        return;
      }

      const finish = isLogin ? loginWithGoogle(idToken) : registerWithGoogle(idToken);
      finish
        .then(goToNextStep)
        .catch(() => Alert.alert('Error', 'No se pudo autenticar con Google.'))
        .finally(() => setLoading(false));
    } else if (response?.type === 'error') {
      setLoading(false);
      Alert.alert('Error', 'No se pudo completar el inicio de sesión con Google.');
    } else if (response?.type === 'dismiss') {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  const handleGoogle = async () => {
    if (!IS_GOOGLE_CONFIGURED) {
      Alert.alert(
        'Google no está configurado',
        'Falta EXPO_PUBLIC_GOOGLE_CLIENT_ID. Mientras tanto puedes usar la app en modo local; tus datos se guardan en este dispositivo.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Continuar en modo local',
            onPress: () => {
              continueAsLocal();
              goToNextStep();
            },
          },
        ]
      );
      return;
    }

    setLoading(true);
    try {
      await promptAsync();
    } catch {
      setLoading(false);
      Alert.alert('Error', 'No se pudo abrir la pantalla de Google.');
    }
  };

  const handleLocal = () => {
    continueAsLocal();
    goToNextStep();
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.appName}>Trazzo</Text>
        <Text style={styles.appSubtitle}>
          {isLogin ? 'Inicia sesión para continuar' : 'Crea tu cuenta para empezar'}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.googleButton, loading && styles.googleButtonDisabled]}
        onPress={handleGoogle}
        disabled={loading || !request}
      >
        {loading ? (
          <ActivityIndicator color="#18181B" />
        ) : (
          <>
            <View style={styles.googleIcon}>
              <Text style={styles.googleIconText}>G</Text>
            </View>
            <Text style={styles.googleButtonText}>
              {isLogin ? 'Continuar con Google' : 'Registrarse con Google'}
            </Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.skipButton} onPress={handleLocal} disabled={loading}>
        <Text style={styles.skipButtonText}>Continuar sin cuenta</Text>
      </TouchableOpacity>

      <Text style={styles.helperText}>
        Modo local: tus datos se guardan solo en este dispositivo.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  appName: {
    fontSize: 48,
    fontWeight: '800',
    color: '#18181B',
    letterSpacing: -1,
  },
  appSubtitle: {
    fontSize: 18,
    color: '#27272A',
    marginTop: 8,
    fontWeight: '400',
    textAlign: 'center',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E4E7',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  googleButtonDisabled: {
    opacity: 0.7,
  },
  googleIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F4F4F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIconText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#27272A',
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#18181B',
  },
  skipButton: {
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 12,
  },
  skipButtonText: {
    fontSize: 16,
    color: '#6366F1',
    fontWeight: '600',
  },
  helperText: {
    fontSize: 12,
    color: '#A1A1AA',
    textAlign: 'center',
    marginTop: 12,
  },
});
