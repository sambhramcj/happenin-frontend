import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

// Allowed image MIME types
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
];

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(req: Request) {
  try {
    // 1. SECURITY: Verify user is authenticated
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required' },
        { status: 401 }
      );
    }

    // 2. SECURITY: Verify user is an organizer (only organizers can upload)
    const userRole = (session.user as any)?.role;
    if (userRole !== 'organizer' && userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Only organizers can upload event banners' },
        { status: 403 }
      );
    }

    // 3. Parse and validate file
    const formData = await req.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // 4. SECURITY: Validate file type (strict MIME type check)
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // 5. SECURITY: Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum of ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }

    // 6. SECURITY: Validate file extension matches MIME type
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const mimeToExt: Record<string, string[]> = {
      'image/jpeg': ['jpg', 'jpeg'],
      'image/png': ['png'],
      'image/gif': ['gif'],
      'image/webp': ['webp'],
    };

    const allowedExts = mimeToExt[file.type];
    if (!allowedExts || !fileExt || !allowedExts.includes(fileExt)) {
      return NextResponse.json(
        { error: 'File extension does not match file type' },
        { status: 400 }
      );
    }

    // 7. SECURITY: Generate secure, unique filename
    // Format: {timestamp}-{random}-{userEmailHash}.{ext}
    const userEmailHash = Buffer.from(session.user.email || '')
      .toString('base64')
      .substring(0, 8)
      .replace(/[^a-zA-Z0-9]/g, '');
    
    const randomString = Math.random().toString(36).substring(2, 15);
    const timestamp = Date.now();
    const fileName = `${timestamp}-${randomString}-${userEmailHash}.${fileExt}`;
    const filePath = `event-banners/${fileName}`;

    // 8. Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 9. SECURITY: Additional buffer validation (magic number check)
    const magicNumbers: Record<string, number[]> = {
      'image/jpeg': [0xFF, 0xD8, 0xFF],
      'image/png': [0x89, 0x50, 0x4E, 0x47],
      'image/gif': [0x47, 0x49, 0x46, 0x38],
      'image/webp': [0x52, 0x49, 0x46, 0x46],
    };

    const expectedMagic = magicNumbers[file.type];
    if (expectedMagic) {
      const fileMagic = Array.from(new Uint8Array(arrayBuffer.slice(0, expectedMagic.length)));
      const matches = expectedMagic.every((byte, i) => fileMagic[i] === byte);
      if (!matches) {
        return NextResponse.json(
          { error: 'File content does not match declared type' },
          { status: 400 }
        );
      }
    }

    // 10. Upload to Supabase Storage using anon key
    // Security is enforced by:
    // - Server-side authentication check (line 23-29)
    // - Server-side authorization check (line 32-39)
    // - Multiple file validation layers (lines 52-119)
    // - RLS policies on the bucket (see SUPABASE_SETUP.md)
    // The anon key is safe because only authenticated organizers can reach this point
    const { data, error } = await supabase.storage
      .from('event-banners')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
        cacheControl: '3600',
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return NextResponse.json(
        { error: 'Failed to upload image. Please try again.' },
        { status: 500 }
      );
    }

    // 11. Get public URL
    const { data: urlData } = supabase.storage
      .from('event-banners')
      .getPublicUrl(filePath);

    // 12. Log successful upload (for audit trail)
    console.log(`Image uploaded by ${session.user.email} (${userRole}): ${filePath}`);

    return NextResponse.json({
      success: true,
      imageUrl: urlData.publicUrl,
    });
  } catch (err: any) {
    console.error('Upload error:', err);
    return NextResponse.json(
      { error: 'Server error while uploading image' },
      { status: 500 }
    );
  }
}

