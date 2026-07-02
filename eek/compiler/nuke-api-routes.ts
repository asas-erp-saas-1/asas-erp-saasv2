import fs from 'fs';
import path from 'path';

function nukeFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  if (content.includes('kernel.') || content.includes('@/lib/kernel')) {
    const newContent = `import { NextResponse } from 'next/server';
import { withEEK } from '@/eek/withEEK';

export const GET = withEEK({
  resource: 'system',
  action: 'read',
  handler: async () => {
    return NextResponse.json({ error: "Deprecated legacy execution path." }, { status: 410 });
  }
});
export const POST = withEEK({
  resource: 'system',
  action: 'write',
  handler: async () => {
    return NextResponse.json({ error: "Deprecated legacy execution path." }, { status: 410 });
  }
});
`;
    fs.writeFileSync(filePath, newContent);
    console.log(`Nuked ${filePath}`);
  }
}

function scanDir(dir: string) {
  for (const file of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scanDir(fullPath);
    } else if (fullPath.endsWith('route.ts')) {
      nukeFile(fullPath);
    }
  }
}

scanDir(path.join(process.cwd(), 'src/app/api'));
