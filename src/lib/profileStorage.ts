import { supabase } from "@/lib/supabase";

// Client-side helper: upload a profile photo to Supabase Storage and return public URL
export async function uploadProfilePhoto(file: File, studentEmail: string) {
  if (!file) throw new Error("No file provided");
  if (!studentEmail) throw new Error("studentEmail required");

  const parts = (file.name || "").split('.');
  const ext = parts.length > 1 ? parts.pop() : 'jpg';
  const emailHash = typeof window !== 'undefined'
    ? btoa(studentEmail).replace(/[^a-zA-Z0-9]/g, '').substring(0, 8)
    : Buffer.from(studentEmail).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 8);

  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2,8)}-${emailHash}.${ext}`;
  const filePath = `profile-photos/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('profile-photos')
    .upload(filePath, file, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data: urlData } = supabase.storage
    .from('profile-photos')
    .getPublicUrl(filePath);

  return {
    path: filePath,
    publicUrl: urlData.publicUrl,
  };
}

export async function getProfilePhotoPublicUrl(path: string) {
  if (!path) return null;
  const { data } = supabase.storage.from('profile-photos').getPublicUrl(path);
  return data.publicUrl || null;
}

export async function removeProfilePhoto(path: string) {
  if (!path) return;
  const { error } = await supabase.storage.from('profile-photos').remove([path]);
  if (error) throw error;
}
