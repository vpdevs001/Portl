import { useMutation } from '@tanstack/react-query';
import {
  registerPushToken,
  unregisterPushToken
} from '@/features/notifications/services/notifications';

export function useRegisterPushToken() {
  return useMutation({
    mutationFn: registerPushToken
  });
}

// New in Chapter 16 — used on sign-out so a stale device doesn't keep
// receiving pushes for a session no longer active on it.
export function useUnregisterPushToken() {
  return useMutation({
    mutationFn: unregisterPushToken
  });
}
