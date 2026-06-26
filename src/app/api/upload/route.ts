import { NextRequest, NextResponse } from 'next/server';
// DEPLOYMENT: Cloudinary - Active for production deployment
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// LOCAL: Local file upload - Commented for production deployment
// import { writeFile, mkdir } from 'fs/promises';
// import { existsSync } from 'fs';
// import path from 'path';
import { withAuth, getUserFromRequest } from '@/middleware/withAuth';
import { createAuditLog } from '@/lib/audit';
import { ApiResponse } from '@/types';

// Allowed file types and their MIME types
const ALLOWED_FILE_TYPES = {
  // Documents
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  // Images
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  // Other
  'text/plain': ['.txt'],
};

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

async function handlePost(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const category = formData.get('category') as string; // supplier, tender, bid, contract

    if (!file) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'No file provided' },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Category is required' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Validate file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    const mimeType = file.type;

    const allowedExtensions = ALLOWED_FILE_TYPES[mimeType as keyof typeof ALLOWED_FILE_TYPES];
    if (!allowedExtensions || !allowedExtensions.includes(`.${fileExtension}`)) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Invalid file type' },
        { status: 400 }
      );
    }

    // DEPLOYMENT: Cloudinary upload - Active for production deployment
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const publicId = `${category}/${timestamp}-${randomString}`;

    const uploadResult = await new Promise((resolve: (value: any) => void, reject: (reason?: any) => void) => {
      cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          resource_type: 'auto',
          folder: 'e-procurement',
        },
        (error: any, result: any) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    await createAuditLog({
      userId: user.userId,
      action: 'FILE_UPLOADED',
      module: 'uploads',
      description: `Uploaded file ${file.name} to ${category}`,
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'File uploaded successfully',
      data: {
        filename: (uploadResult as any).public_id,
        originalName: file.name,
        size: file.size,
        mimeType,
        url: (uploadResult as any).secure_url,
      },
    });

    // LOCAL: Local file upload - Commented for production deployment
    // // Create upload directory if it doesn't exist
    // const uploadDir = path.join(process.cwd(), 'public', 'uploads', category);
    // if (!existsSync(uploadDir)) {
    //   await mkdir(uploadDir, { recursive: true });
    // }

    // // Generate unique filename
    // const timestamp = Date.now();
    // const randomString = Math.random().toString(36).substring(2, 15);
    // const filename = `${timestamp}-${randomString}${fileExtension}`;
    // const filepath = path.join(uploadDir, filename);

    // // Convert file to buffer and save
    // const bytes = await file.arrayBuffer();
    // const buffer = Buffer.from(bytes);
    // await writeFile(filepath, buffer);

    // // Generate public URL
    // const publicUrl = `/uploads/${category}/${filename}`;

    // await createAuditLog({
    //   userId: user.userId,
    //   action: 'FILE_UPLOADED',
    //   module: 'uploads',
    //   description: `Uploaded file ${file.name} to ${category}`,
    // });

    // return NextResponse.json<ApiResponse>({
    //   success: true,
    //   message: 'File uploaded successfully',
    //   data: {
    //     filename,
    //     originalName: file.name,
    //     size: file.size,
    //     mimeType,
    //     url: publicUrl,
    //     path: filepath,
    //   },
    // });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handlePost);
