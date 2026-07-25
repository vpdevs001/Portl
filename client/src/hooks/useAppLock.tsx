import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';

// Chapter 3 reserved NSFaceIDUsageDescription in app.json's ios.infoPlist
// for this feature ahead of time — no new native config needed here, just
// the JS wiring below. Off by default, same as that chapter's note.
const STORAGE_KEY = 'portl-app-lock-enabled';

type AppLockContextValue = {
  /** Whether the user has turned the biometric lock on, from Settings. */
  enabled: boolean;
  /** Persist the user's Settings toggle. Doesn't itself lock/unlock. */
  setEnabled: (enabled: boolean) => void;
  /** True while the lock screen should be shown over the rest of the app. */
  locked: boolean;
  /** Re-run the biometric/passcode prompt (e.g. a "Try Again" button). */
  attemptUnlock: () => Promise<void>;
  /** Loaded from storage yet — avoids a flash of the lock screen on cold start before we know the preference. */
  isReady: boolean;
};

const AppLockContext = createContext<AppLockContextValue | null>(null);

/**
 * Wraps the app below the auth/session gate. On cold start, if the stored
 * preference is on, starts locked and immediately attempts biometric auth.
 * On every background → active transition, re-locks and re-prompts — a
 * device left unattended mid-session shouldn't stay unlocked indefinitely.
 */
export function AppLockProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabledState] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [locked, setLocked] = useState(false);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        const isOn = stored === 'true';
        setEnabledState(isOn);
        setLocked(isOn);
        if (isOn) {
          attemptUnlock();
        }
      })
      .catch(() => undefined)
      .finally(() => setIsReady(true));
  }, []);

  function setEnabled(next: boolean) {
    setEnabledState(next);
    AsyncStorage.setItem(STORAGE_KEY, String(next)).catch(() => undefined);
    // Turning it on doesn't force an immediate prompt — it takes effect
    // from the next cold start / background-return, same as most apps'
    // "require Face ID" settings.
    if (!next) {
      setLocked(false);
    }
  }

  async function attemptUnlock() {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !isEnrolled) {
        // No Face ID/fingerprint/device passcode set up — don't hold a
        // legitimate user out of their own app over a device that can't
        // authenticate at all.
        setLocked(false);
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Portl',
        // Falls back to the device passcode automatically if biometrics
        // aren't available in the moment (e.g. too many failed Face ID
        // attempts) — native behavior, no extra code needed.
        disableDeviceFallback: false
      });

      if (result.success) {
        setLocked(false);
      }
    } catch {
      // Leave it locked — better to require a retry than silently unlock
      // on an authentication-layer error.
    }
  }

  // Re-lock on every background → active transition, not just cold start.
  useEffect(() => {
    if (!enabled) return;

    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        setLocked(true);
        attemptUnlock();
      }
      appState.current = nextState;
    });

    return () => subscription.remove();
  }, [enabled]);

  const value = useMemo(
    () => ({ enabled, setEnabled, locked: enabled && locked, attemptUnlock, isReady }),
    [enabled, locked, isReady]
  );

  return <AppLockContext.Provider value={value}>{children}</AppLockContext.Provider>;
}

export function useAppLock() {
  const ctx = useContext(AppLockContext);
  if (!ctx) {
    throw new Error('useAppLock must be used within an AppLockProvider');
  }
  return ctx;
}
