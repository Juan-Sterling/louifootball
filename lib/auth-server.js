import { supabase } from '@/lib/supabase';

/**
 * Memverifikasi apakah request berasal dari Admin yang telah login di Supabase Auth.
 * Mengecek Authorization header ('Bearer <token>') dan cookie ('sb-access-token').
 */
export async function verifyAdminAuth(request) {
  try {
    let token = '';

    // 1. Ambil dari Authorization header
    const authHeader = request.headers.get('authorization') || '';
    if (authHeader.toLowerCase().startsWith('bearer ')) {
      token = authHeader.substring(7).trim();
    }

    // 2. Fallback: Ambil dari Cookie
    if (!token) {
      const cookieHeader = request.headers.get('cookie') || '';
      const match = cookieHeader.match(/sb-access-token=([^;]+)/);
      if (match) {
        token = decodeURIComponent(match[1]).trim();
      }
    }

    if (!token) {
      return {
        authenticated: false,
        user: null,
        error: 'Akses ditolak: Token otentikasi admin tidak ditemukan.',
      };
    }

    // 3. Verifikasi token secara langsung ke Supabase Auth
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return {
        authenticated: false,
        user: null,
        error: 'Akses ditolak: Sesi otentikasi tidak valid atau telah kedaluwarsa. Silakan login ulang.',
      };
    }

    return {
      authenticated: true,
      user,
      error: null,
    };
  } catch (err) {
    return {
      authenticated: false,
      user: null,
      error: `Gagal verifikasi otentikasi: ${err.message || 'Kesalahan sistem'}`,
    };
  }
}

