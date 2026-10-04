import { mkdir, readFile, copyFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Mechanical snapshots keep the phone repo independently buildable.
const root = fileURLToPath(new URL('../', import.meta.url));
const web = path.resolve(root, '../minaara-webapp');
await mkdir(path.join(root, 'assets/brand'), { recursive: true });
await mkdir(path.join(root, 'src/generated'), { recursive: true });
await mkdir(path.join(root, 'src/learning'), { recursive: true });
await copyFile(path.join(web, 'brand/palette.json'), path.join(root, 'src/generated/palette.json'));
const logo = await readFile(path.join(web, 'public/brand/minaara-minaret-mark.svg'), 'utf8');
await writeFile(path.join(root, 'src/generated/logo.ts'), `// Synced from the web app. Do not redraw the logo here.\nexport const logoXml = ${JSON.stringify(logo)};\n`);
await copyFile(path.join(web, 'brand/social/minaara-profile-light.png'), path.join(root, 'assets/brand/icon.png'));
await copyFile(path.join(web, 'brand/social/minaara-mark-transparent.png'), path.join(root, 'assets/brand/mark.png'));
for (const name of ['bkt', 'scheduler', 'types']) {
  await copyFile(path.join(web, `lib/learning-engine/${name}.ts`), path.join(root, `src/learning/${name}.ts`));
}
console.log('Synced existing MINAARA logo, palette, and learning-engine snapshots.');
