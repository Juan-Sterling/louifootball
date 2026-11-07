import { NextResponse } from 'next/server';
import { verifyR2Object } from '@/lib/r2';
import { verifyAdminAuth } from '@/lib/auth-server';

export async function POST(request) {
  try {
    // Verifikasi sesi Admin
    const auth = await verifyAdminAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const body = await request.json();
    const { key } = body;

    if (!key) {
      return NextResponse.json(
        { error: 'Key file R2 wajib disertakan untuk verifikasi.' },
        { status: 400 }
      );
    }

    const verification = await verifyR2Object({ key });

    if (!verification.exists) {
      return NextResponse.json(
        {
          success: false,
          error: verification.error || 'File tidak ditemukan di penyimpanan server setelah upload selesai.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      size: verification.size,
      contentType: verification.contentType,
      message: 'File video berhasil terverifikasi dan tersimpan utuh di server.',
    });
  } catch (error) {
    console.error('Error verifying video object:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memverifikasi status file video.' },
      { status: 500 }
    );
  }
}
