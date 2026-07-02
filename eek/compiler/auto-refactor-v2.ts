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
  if (!filePath.includes('/api/') || !filePath.endsWith('route.ts')) return;

  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;

  const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

  for (const method of methods) {
    // We want to replace exactly:
    // export async function GET(request: Request) {
    // with:
    // export const GET = withEEK({
    //   resource: 'any', action: 'read', handler: async (ctx, request) => {
    
    const regex1 = new RegExp(`export\\s+async\\s+function\\s+${method}\\s*\\(([^)]*)\\)\\s*\\{`, 'g');
    const regex2 = new RegExp(`export\\s+function\\s+${method}\\s*\\(([^)]*)\\)\\s*\\{`, 'g');
    
    let action = method === 'GET' ? 'read' : method === 'DELETE' ? 'delete' : 'write';
    
    let originalLength = content.length;
    
    content = content.replace(regex1, `export const ${method} = withEEK({\n  resource: 'any',\n  action: '${action}',\n  handler: async (ctx, $1) => {`);
    content = content.replace(regex2, `export const ${method} = withEEK({\n  resource: 'any',\n  action: '${action}',\n  handler: async (ctx, $1) => {`);
    
    if (content.length !== originalLength) {
        changed = true;
        // Need to add closing "});" at the end of the method block.
        // For simplicity, we can just find the end of the file or the last closing brace and replace it.
        // Actually this is tricky without an AST parser. Let's just use jscodeshift or babel, or just find the last `}` of the function block.
        // A simple heuristic for these simple route files: find the next matching closing brace? Or just replace the very last `}` with `});`? 
        // Wait, most files have multiple methods exported. 
        // We'll just run ESLint with a custom rule to auto-fix? Or we can just use `ts-morph`.
    }
  }

}

