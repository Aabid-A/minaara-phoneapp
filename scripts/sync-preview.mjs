import { readFile, writeFile } from 'node:fs/promises';
// Import existing DEVELOPMENT seed verbatim, never generate religious content.
// This is not an editorial approval signal. Preview is visibly labelled in the app.
const source = '../minaara-webapp/supabase/migrations/20260419143000_curate_fatihah_active_recall.sql';
const sql = await readFile(new URL(`../${source}`, import.meta.url), 'utf8');
const tables = {};
for (const match of sql.matchAll(/INSERT INTO (\w+)\s*\(([^)]+)\)\s*VALUES\s*([\s\S]*?);/g)) {
  const [, table, columns, values] = match;
  const names = columns.split(',').map(x => x.trim());
  // SQL literal tokenizer supports doubled apostrophes. Only read VALUES tuples.
  const tokens = [...values.matchAll(/'((?:[^']|'')*)'|\b(true|false|\d+)\b|([(),])/g)];
  let row = [], depth = 0;
  for (const token of tokens) {
    if (token[3] === '(') { depth++; row = []; }
    else if (token[3] === ')') {
      if (depth && row.length === names.length) {
        (tables[table] ??= []).push(Object.fromEntries(names.map((key, i) => [key, row[i]])));
      }
      depth--;
    } else if (depth && token[3] !== ',') {
      row.push(token[1] !== undefined ? token[1].replaceAll("''", "'") : token[2] === 'true' ? true : token[2] === 'false' ? false : Number(token[2]));
    }
  }
}
if (tables.textbook_blocks?.length !== 3 || tables.question_bank?.length !== 6 || tables.mcq_options?.length !== 12) throw new Error('Seed shape changed: inspect before importing.');
await writeFile(new URL('../src/generated/preview.json', import.meta.url), JSON.stringify({ provenance: source, ...tables }, null, 2) + '\n');
console.log('Imported three existing development briefings and six questions, without changing their wording.');
