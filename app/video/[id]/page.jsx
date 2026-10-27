import { redirect } from 'next/navigation';

export default async function VideoRedirectPage({ params }) {
  const { id } = await params;
  redirect(`/v/${id}`);
}
