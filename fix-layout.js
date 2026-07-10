const fs = require('fs');

const file = 'src/app/layout.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/<ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>/g, "");
content = content.replace(/<\/ThemeProvider>/g, "");

content = content.replace(/import \{ ThemeProvider \} from '@\/components\/ThemeProvider'/g, "");

fs.writeFileSync(file, content, 'utf8');
