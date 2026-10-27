import { S3Client, PutObjectCommand, HeadObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'justerstore';
const R2_FOLDER = process.env.R2_FOLDER || 'louifootball';
const NEXT_PUBLIC_R2_PUBLIC_URL = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL || 'https://cdn.justermp.my.id').replace(/\/+$/, '');

let s3ClientInstance = null;

export function getR2Client() {
  if (!s3ClientInstance) {
    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
      throw new Error('Kredensial Cloudflare R2 belum lengkap di environment variable.');
    }

    s3ClientInstance = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return s3ClientInstance;
}

/**
 * Generate a signed PUT URL for uploading directly from browser to Cloudflare R2
 */
export async function getPresignedUploadUrl({ fileName, contentType, folder = R2_FOLDER }) {
  const client = getR2Client();

  // Bersihkan nama file dari karakter aneh
  const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const uniqueKey = `${folder}/${Date.now()}_${cleanFileName}`;

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: uniqueKey,
    ContentType: contentType,
  });

  // URL presigned berlaku selama 15 menit
  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 900 });
  const publicUrl = `${NEXT_PUBLIC_R2_PUBLIC_URL}/${uniqueKey}`;

  return {
    uploadUrl,
    key: uniqueKey,
    publicUrl,
  };
}

/**
 * Verifikasi apakah file benar-benar sudah ada di Cloudflare R2 dan berukuran valid
 */
export async function verifyR2Object({ key }) {
  const client = getR2Client();

  try {
    const headCommand = new HeadObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });

    const response = await client.send(headCommand);

    if (response && (response.ContentLength || 0) > 0) {
      return {
        exists: true,
        size: response.ContentLength,
        contentType: response.ContentType,
      };
    }

    return {
      exists: false,
      error: 'Ukuran file video terdeteksi 0 byte (kosong).',
    };
  } catch (err) {
    return {
      exists: false,
      error: err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404
        ? 'File video tidak ditemukan di penyimpanan server.'
        : `Gagal verifikasi video: ${err.message}`,
    };
  }
}

/**
 * Hapus file dari Cloudflare R2 berdasarkan Key atau URL lengkap
 */
export async function deleteR2Object({ key, url }) {
  const client = getR2Client();
  let targetKey = key;

  if (!targetKey && url) {
    // Ekstrak key dari URL publik
    try {
      const parsedUrl = new URL(url);
      targetKey = parsedUrl.pathname.replace(/^\/+/, '');
    } catch {
      // Jika bukan URL valid, coba gunakan string url langsung jika formatnya path
      targetKey = url.replace(/^https?:\/\/[^/]+\//, '');
    }
  }

  if (!targetKey) {
    throw new Error('Key atau URL file R2 tidak valid.');
  }

  const deleteCommand = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: targetKey,
  });

  await client.send(deleteCommand);
  return { success: true, key: targetKey };
}
