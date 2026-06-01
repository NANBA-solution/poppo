declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_ANTHROPIC_API_KEY?: string;
    EXPO_PUBLIC_ANTHROPIC_MODEL?: string;
    EXPO_PUBLIC_API_BASE_URL?: string;
    EXPO_PUBLIC_POPPO_API_SECRET?: string;
    EXPO_PUBLIC_FACEBOOK_APP_ID?: string;
    EXPO_PUBLIC_SUPABASE_URL?: string;
    EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
    EAS_PROJECT_ID?: string;
  }
}
