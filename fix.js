const fs = require('fs');
const path = require('path');

function walk(dir, done) {
  let results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    var pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(function(file) {
      file = path.resolve(dir, file);
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function(err, res) {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            results.push(file);
          }
          if (!--pending) done(null, results);
        }
      });
    });
  });
}

walk('src', (err, results) => {
  if (err) throw err;
  for (const file of results) {
    // skip lib/supabase/server.ts so we don't mess up its definition
    if (file.endsWith('src/lib/supabase/server.ts')) continue;
    
    let content = fs.readFileSync(file, 'utf8');
    
    // Fix imports
    content = content.replace(/import \{ await createServerSupabaseClient\(\) \}/g, 'import { createServerSupabaseClient }');
    content = content.replace(/import \{ await createServerSupabaseClient\(\),/g, 'import { createServerSupabaseClient,');
    
    // Fix double parens
    content = content.replace(/await createServerSupabaseClient\(\)\(\)/g, 'await createServerSupabaseClient()');
    
    // Fix await await
    content = content.replace(/await await createServerSupabaseClient\(\)/g, 'await createServerSupabaseClient()');
    
    // Fix all remaining createServerSupabaseClient() that don't have await right before them or import
    // Note negative lookbehind doesn't always work in older Node, but Node 22 supports it.
    // Let's use simple replace
    let lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('createServerSupabaseClient()')) {
            if (!lines[i].includes('import') && !lines[i].includes('await createServerSupabaseClient()')) {
                lines[i] = lines[i].replace(/createServerSupabaseClient\(\)/g, 'await createServerSupabaseClient()');
            }
        }
    }
    content = lines.join('\n');
    
    fs.writeFileSync(file, content, 'utf8');
  }
  console.log("Fix completed");
});
