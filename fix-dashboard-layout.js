const fs = require('fs');

const file = 'src/app/dashboard/layout.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/import \{ NextMobileMenu \} from '@\/components\/MobileMenu'/g, "import { NextMobileMenu } from '@/components/NextMobileMenu'");

fs.writeFileSync(file, content, 'utf8');
