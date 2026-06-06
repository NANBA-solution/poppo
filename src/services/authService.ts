import type { Session } from '@supabase/supabase-js';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

import { getSupabase } from '@/lib/supabase';
import { isSupabaseConfigured } from '@/lib/supabaseConfig';

const DEFAULT_DISPLAY_NAME = 'ぽっぽ野郎';

let initPromise: Promise<Session | null> | null = null;

export type AuthProviderType = 'signed_out' | 'anonymous' | 'apple' | 'other';

export function isAuthCloudEnabled(): boolean {
  return isSupabaseConfigured();
}

export async function ensureSupabaseSession(): Promise<Session | null> {
  if (!isSupabaseConfigured()) return null;

  if (initPromise) return initPromise;

  initPromise = (async () => {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data: existing } = await supabase.auth.getSession();
    if (existing.session) {
      return existing.session;
    }

    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.warn('[auth] anonymous sign-in failed:', error.message);
      return null;
    }
    return data.session;
  })();

  return initPromise;
}

export async function getCurrentUserId(): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

async function ensureProfileRow(displayName?: string): Promise<void> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();
  if (!supabase || !userId) return;

  const name = displayName?.trim().slice(0, 20) || DEFAULT_DISPLAY_NAME;

  const { error } = await supabase.from('profiles').upsert(
    {
      id: userId,
      display_name: name,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  );

  if (error) {
    console.warn('[auth] profile sync failed:', error.message);
  }
}

export function canUseAppleSignIn(): boolean {
  return (
    Platform.OS === 'ios' &&
    isSupabaseConfigured() &&
    requireOptionalNativeModule('ExpoAppleAuthentication') != null
  );
}

type AppleCredential = {
  identityToken?: string | null;
  fullName?: { givenName?: string | null; familyName?: string | null } | null;
  email?: string | null;
};

function createNonce(): string {
  const random = `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  return `poppo-${random}`;
}

function displayNameFromApple(credential: AppleCredential): string | undefined {
  const given = credential.fullName?.givenName?.trim() ?? '';
  const family = credential.fullName?.familyName?.trim() ?? '';
  const full = `${family} ${given}`.trim();
  if (full) return full.slice(0, 20);

  const email = credential.email?.trim() ?? '';
  if (email.includes('@')) {
    return email.split('@')[0].slice(0, 20);
  }
  return undefined;
}

export async function signInWithAppleAndMigrate(): Promise<void> {
  if (!canUseAppleSignIn()) {
    throw new Error('Apple ログインは iOS でのみ利用できます');
  }
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase 未設定');

  if (requireOptionalNativeModule('ExpoAppleAuthentication') == null) {
    throw new Error(
      'この開発ビルドに Apple ログインが含まれていません。`npm run build:dev:ios` で作り直してください。',
    );
  }

  const AppleAuthentication = await import('expo-apple-authentication');
  const currentUserId = await getCurrentUserId();
  const nonce = createNonce();
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
    nonce,
  });

  const token = credential.identityToken;
  if (!token) throw new Error('Apple の認証トークンが取得できませんでした');

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token,
    nonce,
  });
  if (error || !data.session) {
    throw new Error(error?.message ?? 'Apple ログインに失敗しました');
  }

  const newUserId = data.session.user.id;
  if (currentUserId && currentUserId !== newUserId) {
    const { error: migrateError } = await supabase.rpc('migrate_user_data', {
      from_user: currentUserId,
      to_user: newUserId,
    });
    if (migrateError) {
      console.warn('[auth] data migration failed:', migrateError.message);
    }
  }

  await ensureProfileRow(displayNameFromApple(credential));
}

export async function getAuthProviderType(): Promise<AuthProviderType> {
  const supabase = getSupabase();
  if (!supabase) return 'signed_out';

  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (!user) return 'signed_out';

  const provider = (user.app_metadata?.provider as string | undefined) ?? '';
  if (provider === 'apple') return 'apple';
  if (provider === 'anonymous') return 'anonymous';
  if (provider) return 'other';
  return 'signed_out';
}
