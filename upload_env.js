const fs = require('fs');
const { execSync } = require('child_process');

if (!fs.existsSync('.env.local')) {
  console.error('.env.local file not found! Run npm run update-env first.');
  process.exit(1);
}

const envContent = fs.readFileSync('.env.local', 'utf-8');
const lines = envContent.split('\n');

for (let line of lines) {
  line = line.trim();
  if (!line || line.startsWith('#')) continue;

  const eqIdx = line.indexOf('=');
  if (eqIdx === -1) continue;

  const key = line.substring(0, eqIdx).trim();
  let val = line.substring(eqIdx + 1).trim();

  // Strip wrapping single or double quotes
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.substring(1, val.length - 1);
  }

  console.log(`Setting ${key}...`);

  for (const env of ['production', 'preview', 'development']) {
    try {
      execSync(`npx vercel env rm ${key} ${env} -y`, { stdio: 'ignore' });
    } catch (e) {
      // Ignore error if it didn't exist
    }

    try {
      execSync(`npx vercel env add ${key} ${env}`, {
        input: val,
        stdio: ['pipe', 'inherit', 'inherit']
      });
      console.log(`  Added to ${env}`);
    } catch (e) {
      console.error(`  Failed to add to ${env}:`, e.message);
    }
  }
}
console.log('Done uploading env vars to Vercel.');
