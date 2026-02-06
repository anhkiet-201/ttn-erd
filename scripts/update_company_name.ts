
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
  
  const targetCompanyId = '-OkbzUJbBAn9lbQmhmn_';
  const newName = 'Chervon MP4';
  
  console.log(`Updating Company ${targetCompanyId} name to "${newName}"...`);
  
  await adminDb.ref(`congTy/${targetCompanyId}`).update({
      tenCongTy: newName,
      updatedAt: new Date().getTime() // Update timestamp
  });
  
  console.log('✅ Update complete.');
  process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
