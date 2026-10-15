import { TYPE } from '@/lib/constants/design-tokens';
import { jumpTerm } from '@/lib/feelings/jump-term';
import { poemUrl } from '@/lib/urls';
import { cn } from '@/lib/utils';

import type { FeelingVerseRow } from '@/lib/server/feelings';

export function FeelingVerseItem({ verse }: { readonly verse: FeelingVerseRow }) {
  const halves = verse.parts.length === 2;
  return (
    <li className="border-b border-border last:border-b-0">
      <a
        href={poemUrl(verse.poem.slug, [jumpTerm(verse.parts)])}
        className="flex flex-col items-center gap-4 rounded-sm px-2 py-7 transition-colors hover:bg-surface-hover focus-visible:ring-1 focus-visible:ring-text focus-visible:outline-none"
      >
        <div className="flex w-fit max-w-full min-w-[min(16em,100%)] flex-col gap-1 text-verse text-text sm:gap-1.5">
          {verse.parts.map((part, partIndex) => (
            <p
              // oxlint-disable-next-line react/no-array-index-key -- parts keep their order within the stored row and can repeat
              key={`${partIndex}|${part}`}
              lang="ar"
              className={cn(
                'text-center',
                halves && (partIndex === 0 ? 'text-right sm:pe-12' : 'text-left sm:ps-12')
              )}
            >
              {part}
            </p>
          ))}
        </div>
        <p className={cn(TYPE.caption, 'text-text-subtle')}>{verse.poet.name}</p>
      </a>
    </li>
  );
}
