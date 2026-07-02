const fs = require('fs');

const file = 'src/app/api/documents/upload/route.ts';
let content = fs.readFileSync(file, 'utf8');

const regex = /const identity = await \{ tenantId: ctx.organizationId, userId: ctx.session.user.id \}\)/g;
content = content.replace(regex, 'const identity = { tenantId: ctx.organizationId, userId: ctx.session.user.id };');

fs.writeFileSync(file, content, 'utf8');
