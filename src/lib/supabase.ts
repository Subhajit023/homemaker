import 'react-native-url-polyfill/auto';
import 'expo-sqlite/localStorage/install';

import { createClient } from '@supabase/supabase-js';
import { strings } from '@/i18n';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** True when the Supabase keys are set in `.env.local`. Without them the app works offline only. */
export const isCloudConfigured = Boolean(url && key);

export const supabase = isCloudConfigured
  ? createClient(url!, key!, {
      auth: {
        storage: localStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

/** Signs in anonymously if this phone has no session yet. Family membership is tied to this login. */
export async function ensureSignedIn() {
  if (!supabase) throw new Error(strings().family.errors.notSetUp);
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session.user;
  const { data: signedIn, error } = await supabase.auth.signInAnonymously();
  if (error || !signedIn.user) throw new Error(error?.message ?? 'Could not sign in.');
  return signedIn.user;
}
