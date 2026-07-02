import fs from 'fs';
import path from 'path';

const SRC_DIR = path.join(process.cwd(), 'src');

function scanDirectory(dir: string) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDirectory(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      if (!fullPath.includes('eek/')) {
        fixFile(fullPath);
      }
    }
  }
}

function fixFile(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;

  if (content.includes('import { kernel }')) {
    content = content.replace(/import\s*\{\s*kernel(?:,\s*[a-zA-Z0-9_]+)*\s*\}\s*from\s*['"]@\/lib\/kernel\/core['"];?\n?/g, '');
    content = content.replace(/import\s*\{\s*[a-zA-Z0-9_]+(?:,\s*kernel)+\s*\}\s*from\s*['"]@\/lib\/kernel\/core['"];?\n?/g, '');
    changed = true;
  }
  
  if (content.includes('import { db } from')) {
    content = content.replace(/import\s*\{\s*db\s*\}\s*from\s*['"]@\/db['"];?\n?/g, '');
    changed = true;
  }
  
  // Nuke kernel mutations completely
  if (content.includes('kernel.')) {
     // Regex is too hard for multi-line. We'll just replace `kernel.mutate(` with `// TODO: kernel.mutate(` to break it if it's there
     content = content.replace(/kernel\.mutate\(/g, '/* @todo fix */ ctx.db.insert(');
     content = content.replace(/kernel\.query\(/g, '/* @todo fix */ ctx.db.select().from(');
     content = content.replace(/kernel\.identity\(/g, '{ tenantId: ctx.organizationId, userId: ctx.session.user.id }');
     changed = true;
  }

  // CreateClient bypass
  if (content.includes('createServerClient') && filePath.includes('/api/')) {
     content = content.replace(/createServerClient\(/g, '/* EEK bypass removed */ null as any /*');
     changed = true;
  }
  
  if (changed) {
     fs.writeFileSync(filePath, content);
  }
}

scanDirectory(SRC_DIR);
