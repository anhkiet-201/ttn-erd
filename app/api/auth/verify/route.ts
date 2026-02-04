import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { message: 'ID token is required' },
        { status: 400 }
      );
    }

    // Verify the ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Check if user exists in Firebase Authentication
    const userRecord = await adminAuth.getUser(uid);

    if (!userRecord) {
      return NextResponse.json(
        { message: 'Tài khoản không tồn tại' },
        { status: 403 }
      );
    }

    // User is verified and exists in the whitelist
    return NextResponse.json(
      {
        message: 'User verified successfully',
        user: {
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Verify user error:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return NextResponse.json(
        { message: 'Token đã hết hạn' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { message: 'Xác thực thất bại' },
      { status: 500 }
    );
  }
}
