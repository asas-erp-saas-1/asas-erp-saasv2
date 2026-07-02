// @ts-nocheck
import { Project, SyntaxKind, CallExpression } from 'ts-morph';
import * as fs from 'fs';
import * as path from 'path';

const project = new Project();
project.addSourceFilesAtPaths("src/app/api/**/*.ts");
project.addSourceFilesAtPaths("src/services/**/*.ts");
project.addSourceFilesAtPaths("src/domains/**/*.ts");
project.addSourceFilesAtPaths("src/actions/**/*.ts");

function toCamelCase(str: string) {
  return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
}

let filesChanged = 0;

for (const sourceFile of project.getSourceFiles()) {
  let changed = false;

  const text = sourceFile.getFullText();
  if (!text.includes('kernel')) continue;

  sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression).forEach(call => {
     const expression = call.getExpression().getText();
     if (expression === 'kernel.mutate' || expression === 'kernel.query' || expression === 'kernel.transaction' || expression === 'tx.mutate' || expression === 'tx.query') {
        const isTx = expression.startsWith('tx.');
        const ctxRef = isTx ? 'tx' : 'ctx.db';
        const op = expression.split('.')[1];
        const args = call.getArguments();

        if (op === 'mutate' && args.length >= 3) {
           const tableStr = args[0].getText().replace(/['"]/g, '');
           const schemaTable = toCamelCase(tableStr);
           const action = args[1].getText().replace(/['"]/g, '');
           const payload = args[2].getText();

           if (action === 'INSERT') {
              call.replaceWithText(`await ${ctxRef}.insert(_schema.${schemaTable}).values(${payload}).returning()`);
              changed = true;
           } else if (action === 'UPDATE' && args.length >= 4) {
              const filters = args[3].getText();
              call.replaceWithText(`await ${ctxRef}.update(_schema.${schemaTable}).set(${payload}).where(_buildFilters(${filters})).returning()`);
              changed = true;
           }
        } else if (op === 'query' && args.length >= 2) {
           const tableStr = args[0].getText().replace(/['"]/g, '');
           const schemaTable = toCamelCase(tableStr);
           const opts = args[1].getText();
           call.replaceWithText(`await ${ctxRef}.select().from(_schema.${schemaTable}) /* TODO: fix opts ${opts} */`);
           changed = true;
        } else if (op === 'transaction') {
           // kernel.transaction(async (tx) => { ... })
           call.getExpression().replaceWithText(`ctx.db.transaction`);
           changed = true;
        }
     }
  });

  if (changed) {
     // Inject imports
     sourceFile.addImportDeclaration({
        namedImports: ['* as _schema'],
        moduleSpecifier: '@/db/schema'
     });
     // Remove kernel import
     const kernelImport = sourceFile.getImportDeclarations().find(i => i.getModuleSpecifierValue().includes('lib/kernel/core'));
     if (kernelImport) kernelImport.remove();

     sourceFile.saveSync();
     filesChanged++;
  }
}

console.log(`Aggressively decapitated ${filesChanged} files.`);
