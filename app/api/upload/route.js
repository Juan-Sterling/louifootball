import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Default configuration fallbacks
const DEFAULT_CLOUD_NAME =
  process.env.CLOUDINARY_CLOUD_NAME ||
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
  'og1jrvy3';
const DEFAULT_UPLOAD_PRESET =
  process.env.CLOUDINARY_UPLOAD_PRESET ||
  process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ||
  'ml_default';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const customPreset = formData.get('upload_preset') || DEFAULT_UPLOAD_PRESET;
    const customCloud = formData.get('cloud_name') || DEFAULT_CLOUD_NAME;
    const clientApiKey = formData.get('api_key') || process.env.CLOUDINARY_API_KEY;
    const clientApiSecret = formData.get('api_secret') || process.env.CLOUDINARY_API_SECRET;
    const targetFolder = formData.get('folder') || 'louifootball product';

    if (!file) {
      return NextResponse.json({ error: 'Tidak ada file gambar yang dikirim.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const mimeType = file.type || 'image/jpeg';
    const base64Data = `data:${mimeType};base64,${buffer.toString('base64')}`;

    // 1. If API Key and Secret are configured, try Cloudinary SDK signed upload
    if (clientApiKey && clientApiSecret && clientApiKey !== clientApiSecret) {
      try {
        cloudinary.config({
          cloud_name: customCloud,
          api_key: clientApiKey,
          api_secret: clientApiSecret,
          secure: true,
        });

        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload(
            base64Data,
            {
              folder: targetFolder,
              resource_type: 'image',
            },
            (error, res) => {
              if (error) reject(error);
              else resolve(res);
            }
          );
        });

        return NextResponse.json({
          success: true,
          secure_url: result.secure_url,
          public_id: result.public_id,
          format: result.format,
          width: result.width,
          height: result.height,
        });
      } catch (signedErr) {
        console.warn('Signed upload failed (fallback to unsigned preset):', signedErr.message);
        // Fallback to unsigned preset below!
      }
    }

    // 2. Otherwise, use Cloudinary REST API unsigned upload
    const uploadForm = new FormData();
    uploadForm.append('file', base64Data);
    uploadForm.append('upload_preset', customPreset);
    uploadForm.append('folder', targetFolder);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${customCloud}/image/upload`, {
      method: 'POST',
      body: uploadForm,
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      const errMsg = data.error?.message || 'Gagal mengunggah gambar ke Cloudinary.';
      let userFriendlyMsg = errMsg;

      if (errMsg.includes('Upload preset must be whitelisted for unsigned uploads')) {
        userFriendlyMsg = `Upload Preset "${customPreset}" di akun Cloudinary (${customCloud}) belum disetel ke mode "Unsigned". Silakan buka Dashboard Cloudinary > Settings > Upload > Edit Preset "${customPreset}" > ubah Signing Mode ke "Unsigned", atau masukkan CLOUDINARY_API_KEY & CLOUDINARY_API_SECRET ke file .env.local.`;
      } else if (errMsg.includes('Upload preset not found')) {
        userFriendlyMsg = `Upload Preset "${customPreset}" tidak ditemukan di akun Cloudinary (${customCloud}). Buat Upload Preset baru dengan mode Unsigned di Cloudinary.`;
      }

      return NextResponse.json({ error: userFriendlyMsg, rawError: errMsg }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      secure_url: data.secure_url,
      public_id: data.public_id,
      format: data.format,
      width: data.width,
      height: data.height,
    });
  } catch (error) {
    console.error('Upload API route error:', error);
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan saat memproses unggah gambar.' },
      { status: 500 }
    );
  }
}

/**
 * Robustly extract Cloudinary public_id from URL including subfolders and transformations.
 */
export function extractCloudinaryPublicId(url) {
  if (!url || typeof url !== 'string') return null;
  if (!url.includes('cloudinary.com')) return null;

  try {
    const decoded = decodeURIComponent(url);
    const uploadIndex = decoded.indexOf('/upload/');
    if (uploadIndex === -1) return null;

    const remainder = decoded.substring(uploadIndex + 8);
    const segments = remainder.split('/');

    let startIndex = 0;
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      if (/^v\d+$/.test(seg)) {
        startIndex = i + 1;
        break;
      } else if (seg.includes(',') || (seg.includes('_') && !seg.includes(' '))) {
        continue;
      } else {
        startIndex = i;
        break;
      }
    }

    const publicIdWithExt = segments.slice(startIndex).join('/');
    return publicIdWithExt.replace(/\.[a-zA-Z0-9]+$/, '');
  } catch (e) {
    console.error('Error extracting public_id:', e);
    return null;
  }
}

export async function DELETE(request) {
  try {
    const body = await request.json();
    const { public_id, url } = body;

    const customCloud =
      body.cloud_name ||
      process.env.CLOUDINARY_CLOUD_NAME ||
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
      DEFAULT_CLOUD_NAME;
    const apiKey = body.api_key || process.env.CLOUDINARY_API_KEY;
    const apiSecret = body.api_secret || process.env.CLOUDINARY_API_SECRET;

    let targetPublicId = public_id;
    if (!targetPublicId && url) {
      targetPublicId = extractCloudinaryPublicId(url);
    }

    if (!targetPublicId) {
      return NextResponse.json(
        { error: 'public_id atau url tidak ditemukan untuk dihapus.' },
        { status: 400 }
      );
    }

    // Clean public_id from file extension if present (e.g. .jpg, .png)
    targetPublicId = targetPublicId.replace(/\.[a-zA-Z0-9]+$/, '');

    // Cloudinary strictly prohibits unsigned deletions for security reasons
    if (!apiKey || !apiSecret) {
      console.warn(
        `Penghapusan "${targetPublicId}" ditolak Cloudinary: CLOUDINARY_API_KEY dan CLOUDINARY_API_SECRET belum diisi.`
      );
      return NextResponse.json(
        {
          success: false,
          requiresCredentials: true,
          error:
            'Cloudinary mewajibkan CLOUDINARY_API_KEY & CLOUDINARY_API_SECRET untuk menghapus file secara aman. Silakan masukkan di "Opsi Cloudinary" atau file .env.local.',
        },
        { status: 400 }
      );
    }

    if (apiKey === apiSecret) {
      return NextResponse.json(
        {
          success: false,
          requiresCredentials: true,
          error:
            'CLOUDINARY_API_SECRET tidak boleh sama dengan CLOUDINARY_API_KEY. Nilai API Key saat ini adalah "' +
            apiKey +
            '". Silakan buka Cloudinary Dashboard dan salin nilai API Secret yang sebenarnya (kode alfanumerik rahasia di samping API Key).',
        },
        { status: 400 }
      );
    }

    // Configure Cloudinary SDK with provided credentials
    cloudinary.config({
      cloud_name: customCloud,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    const result = await cloudinary.uploader.destroy(targetPublicId, {
      resource_type: 'image',
      invalidate: true,
    });

    if (result.result === 'not found') {
      console.warn(`Cloudinary destroy returned 'not found' for: ${targetPublicId}`);
    }

    return NextResponse.json({
      success: true,
      message: `Gambar "${targetPublicId}" berhasil dihapus dari Cloudinary.`,
      result,
    });
  } catch (error) {
    console.error('Delete image API route error:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal menghapus gambar dari Cloudinary.' },
      { status: 500 }
    );
  }
}
