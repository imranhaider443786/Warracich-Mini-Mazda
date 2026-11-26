import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
for (const scope of SCOPES) {
  provider.addScope(scope);
}
provider.setCustomParameters({ prompt: 'select_account consent' });

let isSigningIn = false;
// Keep OAuth access token strictly in memory — never persist in localStorage/sessionStorage.
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onUserSignedOut?: (user: User | null) => void
) => {
  return onAuthStateChanged(auth, (user: User | null) => {
    if (user && cachedAccessToken) {
      onAuthSuccess?.(user, cachedAccessToken);
    } else if (!isSigningIn) {
      cachedAccessToken = null;
      onUserSignedOut?.(user);
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('NO_DRIVE_TOKEN: Google did not return a Drive access token.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } finally {
    isSigningIn = false;
  }
};

export const formatAuthError = (err: unknown, lang: 'en' | 'ur'): string => {
  const code =
    typeof err === 'object' && err !== null && 'code' in err
      ? String((err as { code?: unknown }).code || '')
      : '';
  const msg = err instanceof Error ? err.message : String(err || '');

  if (code === 'auth/unauthorized-domain') {
    const host = typeof window !== 'undefined' ? window.location.hostname : '';
    return lang === 'ur'
      ? `یہ ڈومین (${host}) فائربیس Authorized Domains میں شامل نہیں ہے۔ (${code})`
      : `Domain "${host}" is not authorized in Firebase Auth (${code}).`;
  }
  if (code === 'auth/popup-blocked') {
    return lang === 'ur'
      ? `براؤزر نے سائن ان پاپ اپ بلاک کر دیا۔ براہ کرم پاپ اپ کی اجازت دیں۔ (${code})`
      : `Sign-in popup was blocked by the browser. Please allow popups (${code}).`;
  }
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return lang === 'ur'
      ? `سائن ان ونڈو مکمل ہونے سے پہلے بند ہو گئی۔ (${code})`
      : `Sign-in popup closed before completing (${code}).`;
  }
  if (code === 'auth/operation-not-allowed') {
    return lang === 'ur'
      ? `فائربیس میں Google Sign-In فعال نہیں ہے۔ (${code})`
      : `Google Sign-In is not enabled in Firebase Authentication (${code}).`;
  }
  if (code === 'auth/network-request-failed') {
    return lang === 'ur'
      ? `انٹرنیٹ یا فائربیس کنکشن ناکام رہا۔ (${code})`
      : `Network request failed during Google sign-in (${code}).`;
  }
  if (msg.startsWith('NO_DRIVE_TOKEN')) {
    return lang === 'ur'
      ? 'گوگل نے ڈرائیو رسائی کا ٹوکن نہیں دیا۔ براہ کرم اجازت والے باکس پر ٹک کریں۔'
      : 'Google did not return a Drive access token. Please allow Google Drive access on the consent screen.';
  }
  const detail = code ? `${code}${msg ? ` — ${msg}` : ''}` : msg || 'Unknown error';
  return lang === 'ur'
    ? `گوگل سائن ان مکمل نہ ہو سکا: ${detail}`
    : `Google sign-in failed: ${detail}`;
};

export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const clearAccessToken = (): void => {
  cachedAccessToken = null;
};

export const logout = async (): Promise<void> => {
  await auth.signOut();
  cachedAccessToken = null;
};
