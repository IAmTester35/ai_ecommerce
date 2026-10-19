import { router, Href } from 'expo-router';

/**
 * Safely navigates back in history stack.
 * If there is no previous screen in history (e.g. direct URL access, page refresh, or deep link),
 * it falls back to the home screen (defaulting to '/(tabs)').
 */
export function safeBack(fallbackHref: Href = '/(tabs)') {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallbackHref as any);
  }
}
