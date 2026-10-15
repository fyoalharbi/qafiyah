# Feelings

The `/feelings` page helps a reader who can't name what they feel. It draws the Feelings Wheel (Geoffrey Roberts, 2015) in Arabic, as a tree that grows from "بمَ تشعر؟". Each feeling links to its own page, `/feelings/<slug>`, which lists the classical verses that express it.

## Shape

- `scripts/db/sql/feelings.sql` creates two tables, and writes the tree at every database init.
  - `feelings` holds 129 feelings: 7 core feelings, 41 middle feelings, and 81 outer feelings. Each has a stable `slug`, its Arabic name, and the wheel's English term.
  - `feeling_verses` holds one row for each verse and feeling: `(poem_id, position, feeling_id, strength)`. A verse holds up to three feelings.
  - `strength` is 3 for a strong, explicit feeling, and 2 for a clear one.
- `refresh_taxonomy_stats()` fills two tables from `feeling_verses` (`docs/domain.md`, "Taxonomy counts"):
  - `feeling_branch_verses` holds one row for each feeling and each shown verse of its branch (the feeling and every feeling below it). Each row has the verse's strongest feeling in that branch and its rank there.
  - The rank puts the strongest verses first. Within one strength, it follows a hash of the verse's poem and position: a fixed shuffle, so a page mixes poets and eras.
  - `feeling_stats` holds each feeling's verse count, from the same rows.
- A deleted verse row takes its feelings with it, like the other tables that hang off a poem.
- The API serves three endpoints: `GET /v1/feelings`, `GET /v1/feelings/{slug}`, and `GET /v1/feelings/{slug}/verses`.
  - A feeling with no verses is left out of the list, and its page is not found.
  - A page lists the verses of the feeling's whole branch, 30 a page, in rank order. It reads the ranks of the page directly, so the last page is as fast as the first.
- The web renders the wheel on the server (`components/feelings/feeling-wheel.tsx`). Every label is a link.
  - `lib/feelings/upright-layout.ts` places each label. `docs/exceptions.md` ("The `/feelings` tree has its own SVG layout") explains why the layout is custom.
  - Each verse links to its poem, and the poem page scrolls to the verse.

## How the verses were classified

The run read every verse once, on 2026-10-14, from dump `0045_12_10_2026`.

- It read the eras from الجاهلي to الأندلسي (eras 1 to 5). It skipped hidden poems, hidden poets, recensions, and rows that are not a complete verse. That is 556,801 verse rows, with 548,304 different texts.
- The model was DeepSeek's `deepseek-flash`, with no reasoning and a temperature of 0. Each request held 20 verses, and the 129 feelings with a short Arabic description of each.
- The first pass listed up to three feelings for each verse, that the poet or a person in the verse clearly feels. It rated each feeling 1 (faint), 2 (clear), or 3 (strong).
- The first pass left out verses that describe, narrate, praise or blame a quality, give wisdom, pray, or mock, unless someone in the verse feels something.
- A second pass asked a yes or no question for each rating of 2. The run kept every rating of 3, each confirmed rating of 2, and no rating of 1.
- The result is 158,387 verses with 193,035 feelings.

## Limitations

- **A machine chose the feelings, so some are wrong.** On 400 random verses that a reviewer labelled by hand, the run found about 62% of the verses that express a feeling. It gave a feeling to 6% of the verses that express none. Its first feeling was right for about 75% to 85% of the verses. The page says that the classification can be wrong.
- **The feelings are uneven.** Sadness and love hold most of the verses. 19 feelings have fewer than 20 verses, and two have none: الطيش and الاضطهاد.
- **Only eras 1 to 5 are classified.** The verses of later eras have no feelings.
- **New and changed verses are not classified.** `merge_poem` moves a merged poem's feelings to the poem that keeps it. A row repair that writes a poem's rows again drops that poem's feelings, and a new poem gets none.

## Changing the tree

To rename a feeling, edit its row in `scripts/db/sql/feelings.sql`. The file updates existing rows, so the next database init applies the change. To apply it to the dev database at once, run the file with `psql`.
