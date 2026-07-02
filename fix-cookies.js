const fs = require('fs');

const file = 'src/app/api/invite/generate/route.ts';
let content = fs.readFileSync(file, 'utf8');

const regex = /const supabase = null as any; \/\/ supabaseUrl, supabaseKey, \{[\s\S]*?\}\);\n/g;
content = content.replace(regex, 'const supabase = null as any;\n');

fs.writeFileSync(file, content, 'utf8');
