import { INLINE_LINK, TYPE } from '@/lib/constants/design-tokens';
import { jumpTerm } from '@/lib/feelings/jump-term';
import { feelingUrl, poemUrl } from '@/lib/urls';
import { cn } from '@/lib/utils';

import type { FeelingVerseRow } from '@/lib/server/feelings';

export function FeelingVerseItem({
  verse,
  showFeeling,
}: {
  readonly verse: FeelingVerseRow;
  readonly showFeeling: boolean;
}) {
  return (
    <li className="flex flex-col gap-1.5 border-b border-border py-5 last:border-b-0">
      <p className={cn(TYPE.subheading, 'flex flex-wrap gap-x-11 leading-loose text-text')}>
        {verse.parts.map((part, partIndex) => (
          // oxlint-disable-next-line react/no-array-index-key -- parts keep their order within the stored row and can repeat
          <span key={`${partIndex}|${part}`}>{part}</span>
        ))}
      </p>
      <p className={cn(TYPE.caption, 'flex flex-wrap gap-x-3.5 text-text-muted')}>
        <span>{verse.poet.name}</span>
        <span>{verse.era.name}</span>
        <a href={poemUrl(verse.poem.slug, [jumpTerm(verse.parts)])} className={INLINE_LINK}>
          {verse.poem.title}
        </a>
        {showFeeling && (
          <a href={feelingUrl(verse.feeling.slug)} className={INLINE_LINK}>
            {verse.feeling.name}
          </a>
        )}
      </p>
    </li>
  );
}
