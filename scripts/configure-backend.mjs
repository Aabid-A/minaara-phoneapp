import { readFile, writeFile, access } from 'node:fs/promises';
const destination = new URL('../.env.local', import.meta.url);
try { await access(destination); console.log('Existing phone configuration preserved.'); process.exit(0); } catch {}
const source = await readFile(new URL('../../minaara-webapp/.env.local', import.meta.url), 'utf8');
const names = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
const values = names.map(name => {
  const match = source.match(new RegExp(`^NEXT_PUBLIC_${name}=(.*)$`, 'm'));
  if (!match?.[1]?.trim()) throw new Error(`Public ${name} is missing. Use .env.example to configure manually.`);
  return `EXPO_PUBLIC_${name}=${match[1]}`;
});
await writeFile(destination, '# Public client credentials copied from the existing web app. No server secrets.\n' + values.join('\n') + '\n', { mode: 0o600 });
console.log('Configured the existing backend using only its public URL and public anon key. Values are not printed.');
