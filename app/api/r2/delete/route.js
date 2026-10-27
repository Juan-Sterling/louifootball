import { NextResponse } from 'next/server';
import { deleteR2Object } from '@/lib/r2';

async function handleDelete(request) {
  try {
    let body = {};
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      body = await request.json();
    } else {
      const text = await request.text();
      try {
        body = JSON.parse(text);
      } catch {
        body = {};
      }
    }

    const { key, url } = body;

    if (!key && !url) {
      return NextResponse.json(
        { error: 'Key atau URL file video wajib disertakan untuk penghapusan.' },
        { status: 400 }
      );
    }

    const result = await deleteR2Object({ key, url });

    return NextResponse.json({
      success: true,
      message: 'File video berhasil dihapus dari penyimpanan.',
      key: result.key,
    });
  } catch (error) {
    console.error('Error deleting video object:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal menghapus file video.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  return handleDelete(request);
}

export async function POST(request) {
  return handleDelete(request);
}
