const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

walk('./src', function(filePath) {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // Fix supabase creation that was corrupted by the compiler
    if (content.includes('null as any; /* EEK bypass removed */ /*')) {
       // Replace the opening comment with a normal line comment
       content = content.replace(/null as any; \/\* EEK bypass removed \*\/ \/\*/g, 'null as any; // EEK bypass removed ');
    }
    
    // Also remove the closing "});" of that block if we can find it
    // Actually, since we commented out the opening line with //, the remaining lines:
    //      cookies: {
    //        getAll() { return cookieStore.getAll(); },
    //        setAll() {}
    //      }
    //    });
    // will cause syntax errors because they are no longer inside a function call!
    // So let's replace the whole block.
    
    const blockRegex = /const supabase = null as any; \/\/ EEK bypass removed supabaseUrl, supabaseKey, \{[\s\S]*?\}\);/g;
    content = content.replace(blockRegex, 'const supabase = null as any; // EEK bypass removed');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Fixed supabase in:', filePath);
    }
  }
});
