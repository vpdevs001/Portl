/**
 * Minimal Expo push helper — pulled forward from Chapter 16 since Chapter 7
 * (Visitor Management) is the first thing that actually needs to send a
 * push. Chapter 16 later hardens this (batching into chunks of 100,
 * receipt polling, pruning dead tokens) rather than building it from
 * scratch. For now this is a best-effort fire-and-forget: a failed push
 * should never fail the request/response flow it was triggered from.
 */

const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';

export type PushMessage = {
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

export async function sendPushNotifications(tokens: string[], message: PushMessage): Promise<void> {
  const validTokens = [...new Set(tokens)].filter((token) => token.startsWith('ExponentPushToken'));

  if (validTokens.length === 0) {
    return;
  }

  const payload = validTokens.map((to) => ({
    to,
    sound: 'default',
    title: message.title,
    body: message.body,
    data: message.data ?? {}
  }));

  try {
    await fetch(EXPO_PUSH_ENDPOINT, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
  } catch {
    // Best-effort — the client-side 5s poll (Chapter 7 fallback) will still
    // pick up the new request even if the push itself failed to send.
  }
}
