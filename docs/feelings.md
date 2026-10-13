# Feelings

The `/feelings` page helps a reader who can't name what they feel. The reader picks a core feeling, then a narrower one, then a precise one, from a tree that grows down from "بمَ تشعر؟". The page then shows verses from the catalog that express the precise feeling.

## Shape

- `apps/web/src/lib/feelings/feeling-tree.ts` holds the tree: 7 core feelings, their sub-feelings, and 76 precise feelings.
  - Every feeling has a stable `slug`, in the same lowercase transliteration as the other taxonomies.
  - The code points at slugs, so an Arabic name can change without breaking anything.
- `apps/web/src/lib/feelings/feeling-verses.ts` holds the verses for each precise feeling, keyed by its slug.
  - Each entry has a poem slug, the poem's title, poet, and era, and the one row that the page shows.
  - The row marks the matched word with `<mark>`. The link to the poem carries the same word, so the poem page highlights it and scrolls to it.
- `apps/web/src/lib/feelings/upright-layout.ts` places each feeling on screen. It is pure: it takes the chosen path and the tree's width, and returns positions and the view transform.
- `apps/web/src/components/feelings/` holds the island that draws the tree and the result.
  - It draws a wide tree and a narrow tree. A CSS container query shows the one that fits, so the page does not move after it loads.
  - `docs/exceptions.md` ("The `/feelings` tree has its own SVG layout") explains why the layout is custom.

Nothing here touches the database, Elasticsearch, or the API schema. The tree and the verses are static data in the web app. They ship with the island of the `/feelings` page (about 17 KB gzipped), which only that page loads. The live site makes no search, API, or database request for them.

## How the verses were chosen

For each precise feeling, a reviewer searched its own word (معزول for معزول) through the public `/v1/search` endpoint, and read the top 20 poem results one by one.

- A verse stayed when it expresses the feeling itself, as the speaker feels it, or as someone feels it whom the poem sympathizes with.
- A verse went when the word appears in mockery or satire (هجاء، تهكم), in a negation (غير منزعج), or in another sense of the same letters (مَحتِد, lineage, for مُحتدّ, angry).
- Each feeling kept up to three verses.

When a feeling's word kept returning another sense, the reviewer renamed the feeling to a word that the catalog uses in that sense: لبس → التباس، متدني → منكسر، عديم الأهمية → مهمَّش, and others.

The review of the pull request replaced four words that were verbs, rare, or out of place under their parent: انتهك → منتهَك، ثار → متقزِّز، منحرج → محرَج، ثائر → جذلان. The reviewer searched their verses again in the same way. The catalog has only two verses with متقزِّز.

## Limitations

- **The search finds verses by word, not by meaning.** A verse is a candidate only if it holds the feeling's word, in a form that the search's light stemmer folds to it.
  - A poem that expresses loneliness without the word معزول is never a candidate, so a feeling's best verses can be missing.
  - The stemmer treats related forms with another pattern as separate words (شراسة and شرس, عزلة and معزول), so the search skipped them.
- **The review read only the top 20 results for each word.** The ranking favors titles and exact matches, not how well a verse expresses the feeling.
- **The selection is one reviewer's judgment.** The reviewer judged from the verse alone, without the rest of the poem, whether it is sincere, ironic, or about something else. Some choices are arguable, and a few feelings have only one or two verses.
- **Colloquial poetry is included** where no Fusha verse fit, because the catalog holds both.
- **The verses are copies, not live lookups.** A new dump can merge a poem, credit it to another poet, or correct a row. The page keeps the old text until someone updates `feeling-verses.ts`.

## Keeping the verses current

Run `bun run corpus:check-feelings` after each new dump. It compares every verse with the dev database, and prints each one whose poem, title, poet, era, or row changed. Update those entries in `feeling-verses.ts`, then run it again.

To add or replace a verse, edit `feeling-verses.ts`. Its tests check these things:

- Every listed feeling exists in the tree.
- Every precise feeling has at least one verse.
- Every verse names its title, poet, and era.
- Every verse marks its matched word.
