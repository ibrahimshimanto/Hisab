import { createClient } from '@supabase/supabase-js';

const STORAGE_URL_KEY = 'hisab_supabase_url';
const STORAGE_ANON_KEY = 'hisab_supabase_anon_key';

export function getSupabaseConfig() {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const storedUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_URL_KEY) : null;
  const storedKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_ANON_KEY) : null;

  const url = storedUrl || envUrl || '';
  const anonKey = storedKey || envKey || '';

  return {
    url,
    anonKey,
    isCustom: Boolean(storedUrl || storedKey),
    isConfigured: Boolean(url && anonKey && url.startsWith('http') && anonKey.length > 20),
  };
}

let supabaseInstance = null;

export function initSupabase() {
  const config = getSupabaseConfig();
  if (config.isConfigured) {
    try {
      supabaseInstance = createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
    } catch (e) {
      console.warn('Supabase initialization warning:', e);
      supabaseInstance = null;
    }
  } else {
    supabaseInstance = null;
  }
  return supabaseInstance;
}

export function getSupabase() {
  if (!supabaseInstance) {
    initSupabase();
  }
  return supabaseInstance;
}

export function isSupabaseConfigured() {
  return getSupabaseConfig().isConfigured;
}

export function saveCustomSupabaseConfig(url, anonKey) {
  if (typeof window !== 'undefined') {
    if (url) localStorage.setItem(STORAGE_URL_KEY, url.trim());
    if (anonKey) localStorage.setItem(STORAGE_ANON_KEY, anonKey.trim());
  }
  supabaseInstance = null;
  return initSupabase();
}

export function clearCustomSupabaseConfig() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_URL_KEY);
    localStorage.removeItem(STORAGE_ANON_KEY);
  }
  supabaseInstance = null;
  return initSupabase();
}

export const supabase = getSupabase();
export default supabase;
