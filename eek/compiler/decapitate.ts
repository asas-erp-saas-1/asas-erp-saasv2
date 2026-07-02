import * as fs from 'fs';
import * as path from 'path';

function walk(dir: string, callback: (filepath: string) => void) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const fp = path.join(dir, f);
    if (fs.statSync(fp).isDirectory()) walk(fp, callback);
    else callback(fp);
  }
}

walk(path.join(process.cwd(), 'src/services'), (filepath) => {
  if (!filepath.endsWith('.ts')) return;
  let code = fs.readFileSync(filepath, 'utf8');
  let changed = false;

  if (code.includes('kernel.')) {
     code = code.replace(/import\s*\{\s*kernel\s*\}\s*from\s*['"][^'"]+['"];?/g, "import { EEKProtectedContext } from '@/eek/types';");
     
     // Rewrite static methods to receive ctx
     code = code.replace(/static\s+async\s+(\w+)\s*\(([^)]*)\)\s*(?::\s*Promise<[^>]+>)?\s*\{/g, (match, methodName, args) => {
        const newArgs = args.trim().length > 0 ? `ctx: EEKProtectedContext, ${args}` : `ctx: EEKProtectedContext`;
        return `static async ${methodName}(${newArgs}) {`;
     });

     // Replace kernel.query
     code = code.replace(/await\s+kernel\.query<any>\(\s*'([^']+)',\s*\{[^}]*\}\s*\)/g, 'await ctx.db.select().from(ctx.db._schemas[$1] || $1).where(ctx.db._eq($1.organizationId, ctx.organizationId))');
     code = code.replace(/await\s+kernel\.query\(\s*'([^']+)',\s*\{[^}]*\}\s*\)/g, 'await ctx.db.select().from(ctx.db._schemas[$1] || $1).where(ctx.db._eq($1.organizationId, ctx.organizationId))');

     // Remove identity
     code = code.replace(/const identity = await kernel\.identity\(\);/g, '');
     code = code.replace(/identity\.tenantId/g, 'ctx.organizationId');
     code = code.replace(/identity\.userId/g, 'ctx.session.user.id');

     code = code.replace(/await\s+kernel\.transaction\s*\(\s*async\s*\(\s*tx\s*\)\s*=>\s*\{/g, 'await ctx.db.transaction(async (tx) => {');
     
     code = code.replace(/kernel\.mutate<any>/g, 'ctx.db.insert');
     code = code.replace(/kernel\.mutate/g, 'ctx.db.insert');
     
     changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(filepath, code, 'utf8');
    console.log('Decapitated', filepath);
  }
});

