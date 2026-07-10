const fs = require('fs');
const file = 'src/app/dashboard/layout.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/import \{ SidebarNav, NAV_GROUPS_STATE \} from '@\/components\/SidebarNav'/g, "import { SidebarNav } from '@/components/SidebarNav';\nconst NAV_GROUPS_STATE = [];");

fs.writeFileSync(file, content, 'utf8');
