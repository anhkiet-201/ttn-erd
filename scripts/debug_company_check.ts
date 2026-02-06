
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

async function main() {
  console.log('Initializing Firebase Admin...');
  const { adminDb } = await import('../lib/firebase/admin');
  
  if (!adminDb) {
    console.error('Failed to initialize Firebase Admin.');
    process.exit(1);
  }

  // 1. Check Company
  const targetCompanyId = '-OkbzUJbBAn9lbQmhmn_';
  console.log(`\nChecking Company ID: ${targetCompanyId}`);
  const companyRef = adminDb.ref(`congTy/${targetCompanyId}`);
  const companySnap = await companyRef.once('value');
  
  if (companySnap.exists()) {
    console.log('✅ Company FOUND:', companySnap.val());
  } else {
    console.warn('❌ Company NOT FOUND');
    // List all companies to see if we have close matches or what IDs exist
    console.log('Listing first 5 companies to check IDs:');
    const allCompaniesSnap = await adminDb.ref('congTy').limitToFirst(5).once('value');
    console.log(allCompaniesSnap.val());
  }

  // 2. Check Banned Worker Data
  console.log('\nChecking Banned Worker Data sample...');
  const bannedRef = adminDb.ref('nguoiLaoDongBiCam');
  const bannedSnap = await bannedRef.limitToLast(1).once('value'); // Get last one (imported recently)
  
  if (bannedSnap.exists()) {
     const data = bannedSnap.val();
     const key = Object.keys(data)[0];
     const worker = data[key];
     console.log(`Worker: ${worker.tenNguoiLaoDong} (${worker.cccd})`);
     console.log('NguyenNhanCam:', JSON.stringify(worker.nguyenNhanCam, null, 2));
  } else {
      console.log('No banned workers found.');
  }
  
  process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
