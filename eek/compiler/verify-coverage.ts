import fs from 'fs';
import path from 'path';

const SRC_DIR = path.join(process.cwd(), 'src');
let errors = 0;

function scanDirectory(dir: string) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDirectory(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      checkFile(fullPath);
    }
  }
}

function checkFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');

  // 1. Check for Server Actions
  if (content.includes('use server')) {
    if (!content.includes('withActionEEK')) {
      console.error(`🚨 [EEK COMPILER ERROR] Server Action found without withActionEEK wrapper in: ${filePath}`);
      errors++;
    }
  }

  // 2. Check for API Routes
  if (filePath.includes('/api/') && filePath.endsWith('route.ts')) {
    const methods = ['POST', 'PUT', 'DELETE', 'PATCH', 'GET'];
    for (const method of methods) {
      if (content.includes(`export async function ${method}`) || content.includes(`export function ${method}`)) {
         console.error(`🚨 [EEK COMPILER ERROR] Unprotected HTTP ${method} handler found in: ${filePath}. Must use 'export const ${method} = withEEK(...)'`);
         errors++;
      }
    }
  }
  
  if (content.includes('.update(journalEntries)') || content.includes('.update(ledgerAccounts)')) {
     console.error(`🚨 [EEK COMPILER ERROR] Direct UPDATE on financial tables is forbidden. Use ctx.ledger in: ${filePath}`);
     errors++;
  }
}

console.log("🔒 Running EEK Security Compiler Checks...");
scanDirectory(SRC_DIR);
if (errors > 0) {
    console.error(`Found ${errors} EEK compliance errors. Fix them.`);
    process.exit(1);
}
console.log("✅ EEK Compiler checks passed! Zero Trust boundaries are secure.");
