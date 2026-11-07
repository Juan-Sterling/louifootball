import { supabase } from '@/lib/supabase';

/**
 * Fetch wrapper khusus untuk pemanggilan API Admin.
 * Secara otomatis menyertakan Supabase JWT access token di header Authorization.
 */
export async function adminFetch(url, options = {}) {
  let token = null;

  try {
    const { data } = await supabase.auth.getSession();
    token = data?.session?.access_token || null;
  } catch (err) {
    console.warn('Gagal mengambil sesi auth untuk adminFetch:', err);
  }

  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

