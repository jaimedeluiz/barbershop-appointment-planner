/// <reference types="vite/client" />

/**
 * Optional Supabase Client Integration
 * If VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are present in .env,
 * you can seamlessly sync your booking data to Supabase.
 * By default, the application runs entirely on our high-performance
 * reactive local storage layer with zero external setup needed.
 */

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    import.meta.env.VITE_SUPABASE_URL &&
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );
};

export const getSupabaseConfig = () => {
  return {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    isConfigured: isSupabaseConfigured(),
  };
};
