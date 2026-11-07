/**
 * Helper untuk sinkronisasi token sesi ke cookie browser.
 * Diperlukan agar Next.js Server-Side Middleware dapat memvalidasi status login admin
 * sebelum halaman HTML/JS dikirimkan ke peramban.
 */
export function syncAuthCookie(session) {
  if (typeof document === 'undefined') return;

  if (session?.access_token) {
    const maxAge = session.expires_in || 3600 * 24 * 7; // default 7 hari jika tidak ada info expired
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
    document.cookie = `sb-access-token=${encodeURIComponent(session.access_token)}; path=/; max-age=${maxAge}; SameSite=Lax; ${isHttps ? 'Secure;' : ''}`;
  } else {
    document.cookie = 'sb-access-token=; path=/; max-age=0; SameSite=Lax;';
  }
}

export function clearAuthCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = 'sb-access-token=; path=/; max-age=0; SameSite=Lax;';
}

