import { FEELING_VERSES } from '../../apps/web/src/lib/feelings/feeling-verses';
import { ROOT } from '../lib/root';

const csvField = (value: string): string => `"${value.replaceAll('"', '""')}"`;

const rows = Object.entries(FEELING_VERSES).flatMap(([feeling, verses]) =>
  verses.map((verse) =>
    [
      feeling,
      verse.poem,
      verse.title,
      verse.poet,
      verse.era,
      verse.row.replaceAll(/<\/?mark>/gu, ''),
    ]
      .map((field) => csvField(field))
      .join(',')
  )
);

const CHECKS = String.raw`
\pset format unaligned
\pset tuples_only on
SELECT fv.feeling || ' ' || fv.poem || ': ' || coalesce('merged into ' || survivor.slug, 'no such poem')
FROM fv
LEFT JOIN poems p ON p.slug = fv.poem
LEFT JOIN poem_aliases a ON a.slug = fv.poem
LEFT JOIN poems survivor ON survivor.id = a.poem_id
WHERE p.id IS NULL
UNION ALL
SELECT fv.feeling || ' ' || fv.poem || ': hidden, or a recension'
FROM fv JOIN poems p ON p.slug = fv.poem
WHERE p.is_hidden OR p.recension_of_id IS NOT NULL
UNION ALL
SELECT fv.feeling || ' ' || fv.poem || ': the title is now ' || p.title
FROM fv JOIN poems p ON p.slug = fv.poem
WHERE p.title <> fv.title
UNION ALL
SELECT fv.feeling || ' ' || fv.poem || ': the poet is now ' || pt.name
FROM fv JOIN poems p ON p.slug = fv.poem JOIN poets pt ON pt.id = p.poet_id
WHERE pt.name <> fv.poet
UNION ALL
SELECT fv.feeling || ' ' || fv.poem || ': the era is now ' || e.name
FROM fv JOIN poems p ON p.slug = fv.poem JOIN poets pt ON pt.id = p.poet_id JOIN eras e ON e.id = pt.era_id
WHERE e.name <> fv.era
UNION ALL
SELECT fv.feeling || ' ' || fv.poem || ': the poem has no such row'
FROM fv JOIN poems p ON p.slug = fv.poem
WHERE NOT EXISTS (
  SELECT 1 FROM poem_verses pv JOIN verses v ON v.id = pv.verse_id
  WHERE pv.poem_id = p.id AND v.content = fv.line
);
`;

const psql = Bun.spawn(
  [
    './scripts/dev/compose.sh',
    'exec',
    '-T',
    'db',
    'psql',
    '-q',
    '-v',
    'ON_ERROR_STOP=1',
    '-U',
    'qafiyah',
    '-d',
    'qafiyah',
  ],
  { cwd: ROOT, stdin: 'pipe', stdout: 'pipe', stderr: 'inherit' }
);
await psql.stdin.write(
  `CREATE TEMP TABLE fv (feeling text, poem text, title text, poet text, era text, line text);\nCOPY fv FROM STDIN (FORMAT csv);\n${rows.join('\n')}\n\\.\n${CHECKS}`
);
await psql.stdin.end();
const stale = (await new Response(psql.stdout).text()).trim();

if ((await psql.exited) !== 0) {
  console.error('✗ psql failed; start the dev database with `bun run db:up`');
  process.exit(1);
}
if (stale !== '') {
  console.error(`✗ these feeling verses no longer match the catalog:\n${stale}`);
  process.exit(1);
}
console.log(`✓ all ${rows.length} feeling verses match the catalog`);
