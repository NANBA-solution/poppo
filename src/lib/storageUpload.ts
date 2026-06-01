import { getSupabase } from '@/lib/supabase';

/** ローカル file:// / content:// URI を Supabase Storage にアップロードする */
export async function uploadLocalImage(
  bucket: string,
  localUri: string,
  storagePath: string,
): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const ext = localUri.toLowerCase().includes('.png') ? 'png' : 'jpg';
  const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';

  const response = await fetch(localUri);
  const blob = await response.blob();

  const { error } = await supabase.storage.from(bucket).upload(storagePath, blob, {
    contentType,
    upsert: true,
  });

  if (error) {
    console.warn(`[storage:${bucket}] upload failed:`, error.message);
    return null;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
  return data.publicUrl;
}
