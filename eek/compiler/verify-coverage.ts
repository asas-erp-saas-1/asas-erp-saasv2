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
    if (!content.includes('withActionEEK') && filePath.includes('actions/')) {
      console.error(`🚨 [EEK COMPILER ERROR] Server Action found without withActionEEK wrapper in: ${filePath}`);
      errors++;
    }
  }

  // 2. Check for API Routes
  if (filePath.includes('/api/') && filePath.endsWith('route.ts')) {
    const methods = ['POST', 'PUT', 'DELETE', 'PATCH', 'GET'];
    for (const method of methods) {
      if ((content.includes(`export async function ${method}`) || content.includes(`export function ${method}`)) && !content.includes(`withEEK`)) {
         console.error(`🚨 [EEK COMPILER ERROR] Unprotected HTTP ${method} handler found in: ${filePath}. Must use 'export const ${method} = withEEK(...)'`);
         errors++;
      }
    }
  }
  
  // 3. Check for raw DB access
  if (!filePath.includes('/eek/') && !filePath.includes('/db/') && !filePath.includes('auto-refactor') && !filePath.includes('lib/kernel/')) {
    if (content.includes(`import { db } from '@/db'`) || content.match(/from\s+['"]@\/db['"]/) && content.includes(` db `)) {
      console.error(`🚨 [EEK COMPILER ERROR] Raw DB access is forbidden in: ${filePath}. Use ctx.db.`);
      errors++;
    }
  }

  // 4. Financial mutations
  if (content.includes('.update(journalEntries)') || content.includes('.update(ledgerAccounts)')) {
     console.error(`🚨 [EEK COMPILER ERROR] Direct UPDATE on financial tables is forbidden. Use ctx.ledger in: ${filePath}`);
     errors++;
  }

  // 5. Unsafe SQL and Raw Execution
  if (content.includes('.execute(') || content.includes('raw(')) {
     if (!filePath.includes('db/') && !filePath.includes('eek/')) {
         console.error(`🚨 [EEK COMPILER ERROR] Unsafe raw SQL execution detected in: ${filePath}`);
         errors++;
     }
  }

  // 6. Legacy kernel / auth / mutations
  if (content.includes('kernel.mutate') || content.includes('kernel.query') || content.includes('kernel.identity') || content.includes('import { kernel }')) {
      if (!filePath.includes('auto-refactor') && !filePath.includes('aggressive') && !filePath.includes('lib/kernel/')) {
          console.error(`🚨 [EEK COMPILER ERROR] Legacy kernel execution path detected in: ${filePath}`);
          errors++;
      }
  }
  
  // 7. Supabase legacy auth
  const isWhitelist = filePath.includes('auth/') || 
                      filePath.includes('lib/supabase') || 
                      filePath.includes('eek/') || 
                      filePath.includes('SecurityPanel') || 
                      filePath.includes('Client360Drawer') ||
                      filePath.includes('login') ||
                      filePath.includes('signup') ||
                      filePath.includes('onboarding') ||
                      filePath.includes('invite') ||
                      filePath.includes('proxy.ts') ||
                      filePath.includes('lib/realtime');

  if (content.includes('createClient(') || content.includes('createServerClient(') || content.includes('supabase.auth')) {
      if (!isWhitelist) {
          console.error(`🚨 [EEK COMPILER ERROR] Legacy Supabase auth bypass detected in: ${filePath}`);
          errors++;
      }
  }
}

console.log("🔒 Running EEK Security Compiler Checks...");
scanDirectory(SRC_DIR);

if (errors > 0) {
    console.error(`Found ${errors} EEK compliance errors. Fix them.`);
    process.exit(1);
}
console.log("✅ EEK Compiler checks passed! Zero Trust boundaries are secure.");
