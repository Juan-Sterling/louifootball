import { NextResponse } from 'next/server';
import { getPresignedUploadUrl } from '@/lib/r2';

const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 MB

const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime', // .mov
  'video/x-msvideo', // .avi
  'video/x-matroska', // .mkv
  'video/3gpp',
];

export async function POST(request) {
  try {
    const body = await request.json();
    const { fileName, fileType, fileSize } = body;

    if (!fileName || !fileType) {
      return NextResponse.json(
        { error: 'Nama file dan tipe file video wajib disertakan.' },
        { status: 400 }
      );
    }

    // Validasi tipe video
    const isAllowedType = ALLOWED_VIDEO_TYPES.includes(fileType.toLowerCase()) || fileType.toLowerCase().startsWith('video/');
    if (!isAllowedType) {
      return NextResponse.json(
        { error: 'Format file tidak didukung. Harap pilih file video yang valid (MP4, WebM, atau MOV).' },
        { status: 400 }
      );
    }

    // Validasi ukuran video maksimal 100 MB
    if (fileSize && fileSize > MAX_VIDEO_SIZE) {
      const sizeInMB = (fileSize / (1024 * 1024)).toFixed(1);
      return NextResponse.json(
        { error: `Ukuran video melebihi batas maksimal 100 MB (${sizeInMB} MB).` },
        { status: 400 }
      );
    }

    const { uploadUrl, key, publicUrl } = await getPresignedUploadUrl({
      fileName,
      contentType: fileType,
    });

    return NextResponse.json({
      success: true,
      uploadUrl,
      key,
      publicUrl,
    });
  } catch (error) {
    console.error('Error generating R2 presigned URL:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal menyiapkan izin upload video.' },
      { status: 500 }
    );
  }
}
