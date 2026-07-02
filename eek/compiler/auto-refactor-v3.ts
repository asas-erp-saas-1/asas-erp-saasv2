import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

const SRC_DIR = path.join(process.cwd(), 'src');

function scanDirectory(dir: string) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDirectory(fullPath);
    } else if (fullPath.endsWith('route.ts') && fullPath.includes('/api/')) {
      refactorFile(fullPath);
    }
  }
}

function refactorFile(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf-8');
  if (content.includes('withEEK')) return; // Already migrated

  console.log(`Migrating: ${filePath}`);

  // Basic regex replacement for simple files
  const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
  let newContent = content;

  for (const method of methods) {
    const fnRegex = new RegExp(`export\\s+(?:async\\s+)?function\\s+${method}\\s*\\(([^)]*)\\)\\s*(?::\\s*[^{]+)?\\{`);
    const match = fnRegex.exec(newContent);
    if (match) {
       const args = match[1];
       let action = method === 'GET' ? 'read' : method === 'DELETE' ? 'delete' : 'write';
       
       // Find the end of this function. 
       // We can just find the matching brace.
       let openBraces = 0;
       let startIndex = match.index + match[0].length;
       let endIndex = -1;
       
       openBraces = 1;
       for (let i = startIndex; i < newContent.length; i++) {
         if (newContent[i] === '{') openBraces++;
         if (newContent[i] === '}') {
            openBraces--;
            if (openBraces === 0) {
              endIndex = i;
              break;
            }
         }
       }

       if (endIndex !== -1) {
          const before = newContent.slice(0, match.index);
          const inner = newContent.slice(startIndex, endIndex);
          const after = newContent.slice(endIndex + 1);

          newContent = before + `export const ${method} = withEEK({\n  resource: 'system',\n  action: '${action}',\n  handler: async (ctx, ${args}) => {` + inner + `  }\n});` + after;
       }
    }
  }

  if (newContent !== content) {
     newContent = `import { withEEK } from '@/eek/withEEK';\n` + newContent;
     // replace kernel.identity() with ctx.session if we can, but let's just do that manually or later
     fs.writeFileSync(filePath, newContent, 'utf8');
  }
}

scanDirectory(SRC_DIR);
