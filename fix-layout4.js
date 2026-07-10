const fs = require('fs');

const file = 'src/app/layout.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/<Toaster[^>]*\/>/g, "");
content = content.replace(/import \{ Toaster \} from 'react-hot-toast'/g, "");

fs.writeFileSync(file, content, 'utf8');
