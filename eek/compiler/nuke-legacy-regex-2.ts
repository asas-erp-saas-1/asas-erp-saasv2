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

  if (content.includes('kernel.')) {
     content = content.replace(/kernel\.mutate(?:<[^>]+>)?\(/g, '/* @todo fix */ ctx.db.insert(');
     content = content.replace(/kernel\.query(?:<[^>]+>)?\(/g, '/* @todo fix */ ctx.db.select().from(');
     changed = true;
  }
  
  if (changed) {
     fs.writeFileSync(filePath, content);
  }
}

scanDirectory(SRC_DIR);
