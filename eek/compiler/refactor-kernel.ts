import { Project, SyntaxKind, CallExpression } from 'ts-morph';

const project = new Project();
project.addSourceFilesAtPaths("src/**/*.ts");
project.addSourceFilesAtPaths("src/**/*.tsx");

let filesChanged = 0;

for (const sourceFile of project.getSourceFiles()) {
  let changed = false;

  // Find all imports of 'kernel'
  const imports = sourceFile.getImportDeclarations();
  const kernelImport = imports.find(imp => imp.getModuleSpecifierValue() === '@/lib/kernel/core' || imp.getModuleSpecifierValue() === './core');
  
  if (kernelImport) {
     const namedImports = kernelImport.getNamedImports();
     if (namedImports.some(n => n.getName() === 'kernel')) {
        // If we only import kernel, remove it. Else remove just kernel.
        if (namedImports.length === 1) {
           kernelImport.remove();
        } else {
           namedImports.find(n => n.getName() === 'kernel')?.remove();
        }
        changed = true;
     }
  }

  // Find identity = await kernel.identity();
  sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration).forEach(vd => {
     if (vd.getName() === 'identity') {
        const init = vd.getInitializer();
        if (init && init.getText().includes('kernel.identity')) {
           // Replace identity.tenantId with ctx.organizationId, identity.userId with ctx.session.user.id
           // For now, we will replace identity usage inside the function
           vd.remove();
           changed = true;
        }
     }
  });

  // Since we removed 'identity', replace its usages with ctx
  sourceFile.getDescendantsOfKind(SyntaxKind.Identifier).forEach(id => {
     if (id.getText() === 'identity') {
        const parent = id.getParent();
        if (parent && parent.getKind() === SyntaxKind.PropertyAccessExpression) {
           const propAccess = parent.getText();
           if (propAccess === 'identity.tenantId') {
              parent.replaceWithText('ctx.organizationId');
              changed = true;
           } else if (propAccess === 'identity.userId') {
              parent.replaceWithText('ctx.session.user.id');
              changed = true;
           }
        }
     }
  });

  // We need to replace kernel.mutate and kernel.query with an EEK compatible layer,
  // but since rewriting to raw drizzle is too hard (schema names differ from table names),
  // we will inject `import { legacyDb } from '@/lib/kernel/legacy-shim'` and use `legacyDb.mutate(ctx, ...)`
  // Wait, the prompt says "ctx.db has become the official database interface."
  
  // Actually, I can create a shim ON ctx! `ctx.db.legacyQuery` ?
  // No, instructions: "Transform every service into PURE DOMAIN SERVICES."

  if (changed) {
    sourceFile.saveSync();
    filesChanged++;
  }
}

console.log(`Refactored ${filesChanged} files.`);
