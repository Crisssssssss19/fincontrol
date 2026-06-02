import { NextResponse } from 'next/server';
import { userRepository } from '@/infrastructure/repositories/SupabaseUserRepository';
import { UpdateUserProfile } from '@/core/usecases/users/UpdateUserProfile';
import { storageService } from '@/infrastructure/cloudinary/CloudinaryStorageService';
import { getCurrentUser } from '@/infrastructure/security/AuthHelper';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    // Convert file to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Cloudinary (or mock fallback if not configured)
    const avatarUrl = await storageService.uploadFile(buffer, file.name, file.type);

    // Save to user repository
    const usecase = new UpdateUserProfile(userRepository);
    const updatedProfile = await usecase.execute(user.userId, { avatarUrl });

    return NextResponse.json({ success: true, avatarUrl: updatedProfile.avatarUrl });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
