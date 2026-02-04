import * as admin from 'firebase-admin';

function formatPrivateKey(key: string) {
  return key.replace(/\\n/g, '\n');
}

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.error('Missing Firebase Admin environment variables');
  } else {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: formatPrivateKey(privateKey),
        }),
        databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
      });
      console.log('Firebase Admin initialized successfully');
    } catch (error) {
      console.error('Firebase admin initialization error:', error);
    }
  }
}

// Safely export services. If init failed, these getters might throw later, 
// strictly better than crashing module load.
export const adminDb = admin.apps.length ? admin.database() : null as any; 
export const adminAuth = admin.apps.length ? admin.auth() : null as any;

export default admin;
