'use client';

import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useColorScheme } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useAuthStore } from '../hooks/useAuthStore';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
const GOOGLE_REDIRECT_URI = AuthSession.makeRedirectUri({ scheme: 'trazzo' });

const discovery = AuthSession.useAutoDiscovery('https://accounts.google.com');

export default function RegisterScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { registerWithGoogle } = useAuthStore();
  const [loading, setLoading] = React.useState(false);

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_CLIENT_ID,
      redirectUri: GOOGLE_REDIRECT_URI,
      scopes: ['openid', 'profile', 'email'],
      responseType: 'id_token',
    },
    discovery
  );

  React.useEffect(() => {
    if (response?.type === 'success') {
      const idToken = response.params['id_token'];
      if (idToken) handleGoogleResponse(idToken);
    } else if (response?.type === 'error') {
      Alert.alert('Error', 'No se pudo registrar con Google');
      setLoading(false);
    }
  }, [response]);

  const handleGoogleRegister = async () => {
    if (GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com') {
      Alert.alert(
        'Configuración requerida',
        'Por favor configura tu Google Client ID en src/app/register.tsx'
      );
      return;
    }
    setLoading(true);
    await promptAsync();
  };

  const handleGoogleResponse = async (idToken: string) => {
    try {
      await registerWithGoogle(idToken);
      router.replace('/welcome');
    } catch (error) {
      Alert.alert('Error', 'Error al registrar con Google');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipRegister = () => {
    router.replace('/welcome');
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.appName}>Trazzo</Text>
        <Text style={styles.appSubtitle}>Crea tu cuenta para empezar</Text>
      </View>

      <TouchableOpacity style={styles.googleButton} onPress={handleGoogleRegister} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#FFFFFF" size="large" />
        ) : (
          <>
            <View style={styles.googleIcon}>
              <Text style={styles.googleIconText}>G</Text>
            </View>
            <Text style={styles.googleButtonText}>Registrarse con Google</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.skipButton} onPress={handleSkipRegister}>
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