import { ref, push, set, getDatabase } from 'firebase/database';
import { initializeApp } from 'firebase/app';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if config is loaded
if (!firebaseConfig.apiKey) {
  console.error('Error: Firebase API Key is missing. Check your .env.local file.');
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

async function setup() {
  console.log('--- Setting up sample data ---');
  
  // Create Khu Vuc
  const kvRef = ref(database, 'khuVuc');
  const newKvRef = push(kvRef);
  await set(newKvRef, {
    tenKhuVuc: 'Hồ Chí Minh',
    createdAt: Date.now()
  });
  const kvId = newKvRef.key;
  console.log('Created Khu Vuc:', kvId);

  // Create Cong Ty
  const ctRef = ref(database, 'congTy');
  const newCtRef = push(ctRef);
  await set(newCtRef, {
    tenCongTy: 'Công ty TNHH Antigravity Tech',
    khuVuc: { id: kvId, tenKhuVuc: 'Hồ Chí Minh' },
    createdAt: Date.now()
  });
  console.log('Created Cong Ty:', newCtRef.key);
  
  console.log('--- Setup complete ---');
  process.exit(0);
}

setup().catch(err => {
  console.error('Error setting up data:', err);
  process.exit(1);
});
