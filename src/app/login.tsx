'use client';

import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useColorScheme } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useAuthStore } from '../hooks/useAuthStore';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
const GOOGLE_REDIRECT_URI = AuthSession.makeRedirectUri({ scheme: 'trazzo' });

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { loginWithGoogle } = useAuthStore();
  const [loading, setLoading] = React.useState(false);

  const [request, response, promptAsync] = AuthSession.useAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    redirectUri: GOOGLE_REDIRECT_URI,
    scopes: ['openid', 'profile', 'email'],
    responseType: 'id_token',
  });

  React.useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleResponse(response.params.id_token);
    } else if (response?.type === 'error') {
      Alert.alert('Error', 'No se pudo iniciar sesión con Google');
      setLoading(false);
    }
  }, [response]);

  const handleGoogleLogin = async () => {
    if (GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com') {
      Alert.alert(
        'Configuración requerida',
        'Por favor configura tu Google Client ID en src/app/login.tsx'
      );
      return;
    }
    setLoading(true);
    await promptAsync();
  };

  const handleGoogleResponse = async (idToken: string) => {
    try {
      await loginWithGoogle(idToken);
      router.replace('/welcome');
    } catch (error) {
      Alert.alert('Error', 'Error al autenticar con Google');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipLogin = () => {
    router.replace('/welcome');
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.appName}>Trazzo</Text>
        <Text style={styles.appSubtitle}>Inicia sesión para continuar</Text>
      </View>

      <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#FFFFFF" size="large" />
        ) : (
          <>
            <View style={styles.googleIcon}>
              <Text style={styles.googleIconText}>G</Text>
            </View>
            <Text style={styles.googleButtonText}>Continuar con Google</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.skipButton} onPress={handleSkipLogin}>
        <Text style={styles.skipButtonText}>Omitir por ahora</Text>
      </TouchableOpacity>
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
    fontWeight: '500',
  },
});