import Constants from 'expo-constants';

function readPublicConfig(key: string): string {
  const fromEnv = process.env[key as keyof NodeJS.ProcessEnv];
  const fromExtra = Constants.expoConfig?.extra?.[key];
  return (
    (typeof fromEnv === 'string' && fromEnv.trim()) ||
    (typeof fromExtra === 'string' && fromExtra.trim()) ||
    ''
  );
}

export function getSupabaseUrl(): string | undefined {
  const url = readPublicConfig('EXPO_PUBLIC_SUPABASE_URL');
  return url || undefined;
}

export function getSupabaseAnonKey(): string | undefined {
  const key = readPublicConfig('EXPO_PUBLIC_SUPABASE_ANON_KEY');
  return key || undefined;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}
