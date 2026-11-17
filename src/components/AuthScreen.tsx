import { useTheme } from '../hooks/useTheme';
import type { Theme } from '../constants/theme';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../hooks/useAuthStore';
import { AppLogo } from './AppLogo';

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID?.trim() ?? '';
const IS_GOOGLE_CONFIGURED =
  GOOGLE_CLIENT_ID.length > 0 && !GOOGLE_CLIENT_ID.startsWith('YOUR_GOOGLE');

type GoogleAuthModule = typeof import('../utils/googleAuth');

interface AuthScreenProps {
  mode: 'login' | 'register';
}

export function AuthScreen({ mode }: AuthScreenProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const isLogin = mode === 'login';
  const { user, hasHydrated, loginWithGoogle, registerWithGoogle, continueAsLocal } =
    useAuthStore();
  const [loading, setLoading] = useState(false);

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

  const showAlert = (title: string, message: string) => {
    // En Android, al volver de la hoja de Google la Activity puede tardar
    // un instante en estar disponible para mostrar el Alert.
    setTimeout(() => Alert.alert(title, message), 300);
  };

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
    let googleAuth: GoogleAuthModule | null = null;

    try {
      // Se importa en tiempo de ejecución: el módulo nativo no existe en Expo Go.
      googleAuth = await import('../utils/googleAuth');
      const result = await googleAuth.signInWithGoogle();

      if (!result) {
        // El usuario cerró la hoja de Google.
        return;
      }

      try {
        const finish = isLogin
          ? loginWithGoogle(result.idToken, result.profile)
          : registerWithGoogle(result.idToken, result.profile);
        await finish;
      } catch (saveError) {
        console.error('[Google Sign-In] Error al guardar la sesión', saveError);
        showAlert(
          'No se pudieron guardar tus datos',
          'La cuenta de Google se verificó, pero hubo un error al guardar la sesión en este dispositivo.'
        );
        return;
      }

      goToNextStep();
    } catch (error) {
      if (googleAuth?.isGoogleSignInCancelled(error)) {
        return;
      }

      if (googleAuth?.isPlayServicesUnavailable(error)) {
        showAlert(
          'Google Play no disponible',
          'Actualiza Google Play Services en este dispositivo e inténtalo de nuevo.'
        );
        return;
      }

      if (googleAuth?.isGoogleSignInInProgress(error)) {
        showAlert('Espera un momento', 'Ya hay un inicio de sesión de Google en curso.');
        return;
      }

      if (!googleAuth || googleAuth.isNativeModuleMissing(error)) {
        showAlert(
          'Requiere una compilación de desarrollo',
          'El inicio de sesión con Google no funciona en Expo Go. Compila la app con "npx expo run:android" o con un development build de EAS. También puedes continuar en modo local.'
        );
        return;
      }

      console.error('[Google Sign-In] Error', error);
      const info = googleAuth.getGoogleErrorInfo(error);
      const detail = googleAuth.describeGoogleError(error);
      const rawMessage = info.message ? `\n\n${info.message.slice(0, 300)}` : '';

      showAlert(
        'No se pudo iniciar sesión con Google',
        `${detail}\n\nCódigo: ${info.code ?? 'desconocido'}${rawMessage}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLocal = () => {
    continueAsLocal();
    goToNextStep();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.logoContainer}>
        <AppLogo style={styles.logo} />
        <Text style={styles.appName}>Trazzo</Text>
        <Text style={styles.appSubtitle}>
          {isLogin ? 'Inicia sesión para continuar' : 'Crea tu cuenta para empezar'}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.googleButton, loading && styles.googleButtonDisabled]}
        onPress={handleGoogle}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={theme.text} />
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

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 24,
    marginBottom: 20,
  },
  appName: {
    fontSize: 48,
    fontWeight: '800',
    color: theme.text,
    letterSpacing: -1,
  },
  appSubtitle: {
    fontSize: 18,
    color: theme.textSecondary,
    marginTop: 8,
    fontWeight: '400',
    textAlign: 'center',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
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
    backgroundColor: theme.backgroundElement,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIconText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.textSecondary,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  skipButton: {
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 12,
  },
  skipButtonText: {
    fontSize: 16,
    color: theme.primary,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 12,
    color: theme.textSecondary,
    textAlign: 'center',
    marginTop: 12,
  },
});
