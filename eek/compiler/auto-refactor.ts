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
      checkAndRefactorFile(fullPath);
    }
  }
}

function checkAndRefactorFile(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;

  // 1. Refactor API Routes
  if (filePath.includes('/api/') && filePath.endsWith('route.ts')) {
    const methods = ['POST', 'PUT', 'DELETE', 'PATCH', 'GET'];
    
    for (const method of methods) {
      // Very basic regex to match "export async function METHOD(req: Request) {"
      const regex = new RegExp(`export\\s+(?:async\\s+)?function\\s+${method}\\s*\\(([^)]*)\\)\\s*(:\\s*[^{]+)?\\s*\\{`, 'g');
      
      if (regex.test(content)) {
          if (!content.includes('withEEK')) {
              // add import
              content = `import { withEEK } from '@/eek/withEEK';\n` + content;
          }
          content = content.replace(regex, (match, p1) => {
              // p1 is the arguments, e.g. "req: Request, { params }: any"
              // We replace it with "export const METHOD = withEEK({ resource: 'any', action: 'read', handler: async (ctx, ${p1}) => {"
              let action = method === 'GET' ? 'read' : 'write';
              if (method === 'DELETE') action = 'delete';
              
              return `export const ${method} = withEEK({\n  resource: 'any',\n  action: '${action}',\n  handler: async (ctx, ${p1}) => {`;
          });
          
          // Now we need to close the withEEK wrapper.
          // Since it's hard to find the matching closing brace, we will just assume the file ends with the closing brace.
          // WAIT! We can just look for the end of the file or something.
          // Actually, this is too hard to do perfectly with regex.
      }
    }
  }
  
  if (changed) {
      fs.writeFileSync(filePath, content);
      console.log(`Refactored: ${filePath}`);
  }
}

scanDirectory(SRC_DIR);
