import { supabase } from '@/lib/supabase';
import VideoPlayerView from '@/components/VideoPlayerView';
import { decodeProductId } from '@/lib/utils';

export async function generateMetadata({ params }) {
  const { id: rawCode } = await params;
  const resolvedId = decodeProductId(rawCode);

  if (!resolvedId) {
    return {
      title: 'Video Eksklusif - LOUIFOOTBALL',
      robots: { index: false, follow: false },
    };
  }

  const { data: product } = await supabase
    .from('products')
    .select('id, title, player_name, qr_video')
    .eq('id', resolvedId)
    .maybeSingle();

  const title = product?.player_name || product?.title || 'Video Produk';
  return {
    title: `${title} | Video Eksklusif - LOUIFOOTBALL`,
    description: `Tonton video eksklusif merchandise resmi ${title} oleh LOUIFOOTBALL.`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function VideoPage({ params }) {
  const { id: rawCode } = await params;
  const resolvedId = decodeProductId(rawCode);

  if (!resolvedId) {
    return <VideoPlayerView product={null} />;
  }

  const { data: product } = await supabase
    .from('products')
    .select('*, categories(*)')
    .eq('id', resolvedId)
    .maybeSingle();

  return <VideoPlayerView product={product} />;
}
