import { readFile, writeFile } from 'node:fs/promises';
const source = new URL('../../minaara-webapp/lib/practice-submission.ts', import.meta.url);
const target = new URL('../src/generated/practice-submission.ts', import.meta.url);
const contract = await readFile(source, 'utf8');
if (process.argv.includes('--check')) {
  if (await readFile(target, 'utf8') !== contract) throw new Error('Practice contract drift: run npm run contract:sync');
} else await writeFile(target, contract);
