module.exports = {
  rules: {
    'no-raw-db-import': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Forbids importing raw db outside of eek directory',
        },
        schema: [],
      },
      create: function (context) {
        return {
          ImportDeclaration(node) {
            const filename = context.getFilename();
            const sourceValue = node.source.value;
            
            // Allow imports from eek, actions (temporarily if needed), db index itself
            if (filename.includes('/eek/') || filename.includes('/db/') || filename.includes('auto-refactor')) {
              return;
            }

            if (sourceValue === '@/db' || sourceValue === '@/db/') {
              node.specifiers.forEach(specifier => {
                if (specifier.type === 'ImportSpecifier' && specifier.imported.name === 'db') {
                  context.report({
                    node,
                    message: 'Raw DB access is forbidden outside of EEK. Use ctx.db injected by withEEK instead.',
                  });
                }
              });
            }
          },
        };
      },
    },
    'no-unwrapped-server-actions': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Server Actions must be wrapped in withActionEEK',
        },
        schema: [],
      },
      create: function (context) {
        return {
          Program(node) {
            const hasUseServer = node.body.some(
              (stmt) =>
                stmt.type === 'ExpressionStatement' &&
                stmt.expression.type === 'Literal' &&
                stmt.expression.value === 'use server'
            );

            if (hasUseServer) {
              const sourceCode = context.getSourceCode();
              const text = sourceCode.getText();
              if (!text.includes('withActionEEK')) {
                context.report({
                  node,
                  message: 'Server Action found without withActionEEK wrapper. Tenant safety is compromised.',
                });
              }
            }
          },
        };
      },
    },
    'enforce-withEEK': {
      meta: {
        type: 'problem',
        docs: {
          description: 'API Route handlers must use withEEK',
        },
        schema: [],
      },
      create: function (context) {
        return {
          ExportNamedDeclaration(node) {
            const filename = context.getFilename();
            if (filename.includes('/api/') && filename.endsWith('route.ts')) {
              const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
              
              if (node.declaration && node.declaration.type === 'FunctionDeclaration') {
                const name = node.declaration.id.name;
                if (methods.includes(name)) {
                  context.report({
                    node,
                    message: `Unprotected HTTP ${name} handler found. Must use 'export const ${name} = withEEK(...)'`,
                  });
                }
              }
            }
          },
        };
      },
    }
  },
};
