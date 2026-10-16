import { Badge } from '@/components/ui/badge';
import { TYPE } from '@/lib/constants/design-tokens';
import { jumpTerm } from '@/lib/feelings/jump-term';
import { poemUrl } from '@/lib/urls';
import { cn } from '@/lib/utils';

import type { FeelingVerseRow } from '@/lib/server/feelings';

const BADGE_CLASS = 'py-1 text-xs text-text-subtle';

export function FeelingVerseItem({ verse }: { readonly verse: FeelingVerseRow }) {
  const halves = verse.parts.length === 2;
  return (
    <li>
      <a
        href={poemUrl(verse.poem.slug, [jumpTerm(verse.parts)])}
        className="flex h-full flex-col justify-between gap-4 rounded-sm border border-border px-4 py-4 focus-ring transition-colors duration-300 hover:bg-surface-hover sm:px-5"
      >
        <div className={cn(TYPE.caption, 'flex flex-col gap-0.5 text-text sm:text-body')}>
          {verse.parts.map((part, partIndex) => (
            <p
              // oxlint-disable-next-line react/no-array-index-key -- parts keep their order within the stored row and can repeat
              key={`${partIndex}|${part}`}
              lang="ar"
              className={cn(halves && partIndex === 1 && 'text-left')}
            >
              {part}
            </p>
          ))}
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
          <span className={cn(TYPE.caption, 'min-w-0 truncate text-text-muted')}>
            {verse.poet.name}
          </span>
          <div className="flex shrink-0 gap-1">
            <Badge variant="outline" className="border-highlight/45 py-1 text-xs text-highlight">
              {verse.feeling.name}
            </Badge>
            <Badge variant="outline" className={BADGE_CLASS}>
              {verse.era.name}
            </Badge>
          </div>
        </div>
      </a>
    </li>
  );
}
