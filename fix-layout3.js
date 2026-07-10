const fs = require('fs');

const file = 'src/app/layout.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/<GlobalErrorTracker \/>/g, "");
content = content.replace(/import \{ GlobalErrorTracker \} from '@\/components\/GlobalErrorTracker'/g, "");

fs.writeFileSync(file, content, 'utf8');
