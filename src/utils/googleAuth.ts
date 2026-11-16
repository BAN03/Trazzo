import { Platform } from 'react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID?.trim() ?? '';
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() ?? '';

export interface GoogleAccountProfile {
  id: string;
  name: string | null;
  email: string;
  photo: string | null;
}

export interface GoogleSignInResult {
  idToken: string | null;
  profile: GoogleAccountProfile;
}

let isConfigured = false;

const configure = () => {
  if (isConfigured) return;

  GoogleSignin.configure({
    webClientId: WEB_CLIENT_ID || undefined,
    iosClientId: IOS_CLIENT_ID || undefined,
    // No necesitamos acceso al servidor de Google: solo el idToken.
    offlineAccess: false,
    scopes: ['profile', 'email'],
  });
  isConfigured = true;
};

/**
 * Abre la hoja nativa de Google. Devuelve `null` cuando el usuario cancela.
 * Esta función solo debe importarse de forma diferida: el módulo nativo no
 * existe en Expo Go y su importación lanza un error.
 */
export const signInWithGoogle = async (): Promise<GoogleSignInResult | null> => {
  configure();

  if (Platform.OS === 'android') {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  }

  const response = await GoogleSignin.signIn();
  if (response.type !== 'success') {
    return null;
  }

  const { idToken, user } = response.data;
  return {
    idToken,
    profile: {
      id: user.id,
      name: user.name,
      email: user.email,
      photo: user.photo,
    },
  };
};

export interface GoogleErrorInfo {
  code: string | null;
  message: string;
}

export const getGoogleErrorInfo = (error: unknown): GoogleErrorInfo => ({
  code: getErrorCode(error),
  message: error instanceof Error ? error.message : String(error),
});

/**
 * Traduce los errores más comunes de Google a una explicación útil.
 * El código numérico se conserva para poder diagnosticar la configuración.
 */
export const describeGoogleError = (error: unknown): string => {
  const code = getErrorCode(error);

  switch (code) {
    case '10':
    case 'DEVELOPER_ERROR':
      return 'La configuración de Google no coincide con la app. Revisa que el paquete sea com.trazzo.app, que el SHA-1 registrado sea el de esta instalación y que EXPO_PUBLIC_GOOGLE_CLIENT_ID sea un Client ID de tipo Web del mismo proyecto de Google Cloud.';
    case '7':
    case 'NETWORK_ERROR':
      return 'No hay conexión a internet. Revisa tu red e inténtalo de nuevo.';
    case '12500':
    case 'SIGN_IN_FAILED':
      return 'Google rechazó el inicio de sesión. Revisa que la pantalla de consentimiento esté configurada y que tu cuenta aparezca como usuario de prueba si la app está en modo de prueba.';
    case '12501':
    case 'SIGN_IN_CANCELLED':
      return 'Cancelaste el inicio de sesión.';
    case '12502':
    case 'SIGN_IN_CURRENTLY_IN_PROGRESS':
      return 'Ya hay un inicio de sesión en curso. Espera un momento.';
    case 'NULL_PRESENTER':
      return 'No se pudo abrir la ventana de Google. Cierra la app, vuelve a abrirla e inténtalo de nuevo.';
    default:
      return 'Ocurrió un error al comunicarse con Google.';
  }
};

export const isGoogleSignInCancelled = (error: unknown): boolean =>
  getErrorCode(error) === statusCodes.SIGN_IN_CANCELLED;

export const isPlayServicesUnavailable = (error: unknown): boolean =>
  getErrorCode(error) === statusCodes.PLAY_SERVICES_NOT_AVAILABLE;

export const isGoogleSignInInProgress = (error: unknown): boolean =>
  getErrorCode(error) === statusCodes.IN_PROGRESS;

/**
 * Expo Go no incluye el módulo nativo. Detectamos el fallo de importación
 * para mostrar un mensaje claro en lugar de un error genérico.
 */
export const isNativeModuleMissing = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error);
  return /RNGoogleSignin|TurboModuleRegistry|getEnforcing/i.test(message);
};

const getErrorCode = (error: unknown): string | null => {
  if (typeof error !== 'object' || error === null) return null;
  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' ? code : null;
};
