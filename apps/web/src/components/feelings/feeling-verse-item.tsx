import { Check, Copy } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { SITE_URL } from '@/lib/constants/config';
import { FEELING_TEXTS } from '@/lib/constants/copy';
import { TYPE } from '@/lib/constants/design-tokens';
import { jumpTerm } from '@/lib/feelings/jump-term';
import { poemUrl } from '@/lib/urls';
import { cn } from '@/lib/utils';

import type { FeelingVerseRow } from '@/lib/server/feelings';

const BADGE_CLASS = 'py-1 text-xs text-text-subtle';

export function verseCopyText(verse: Pick<FeelingVerseRow, 'parts' | 'poet' | 'poem'>): string {
  return [...verse.parts, '', verse.poet.name, `${SITE_URL}${poemUrl(verse.poem.slug)}`].join('\n');
}

export function FeelingVerseItem({ verse }: { readonly verse: FeelingVerseRow }) {
  const halves = verse.parts.length === 2;
  return (
    <li className="relative flex flex-col justify-between gap-4 rounded-sm border border-border px-4 py-4 transition-colors duration-300 hover:bg-surface-hover sm:px-5">
      <a
        href={poemUrl(verse.poem.slug, [jumpTerm(verse.parts)])}
        className={cn(
          TYPE.caption,
          'flex flex-col gap-0.5 text-text outline-none after:absolute after:inset-0 after:rounded-sm focus-visible:after:ring-1 focus-visible:after:ring-text sm:text-body'
        )}
      >
        {verse.parts.map((part, partIndex) => (
          <span
            // oxlint-disable-next-line react/no-array-index-key -- parts keep their order within the stored row and can repeat
            key={`${partIndex}|${part}`}
            lang="ar"
            className={cn(halves && partIndex === 1 && 'text-left')}
          >
            {part}
          </span>
        ))}
      </a>
      <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
        <span className={cn(TYPE.caption, 'min-w-0 truncate text-text-muted')}>
          {verse.poet.name}
        </span>
        <div className="flex shrink-0 items-center gap-1">
          <Badge variant="outline" className="border-highlight/45 py-1 text-xs text-highlight">
            {verse.feeling.name}
          </Badge>
          <Badge variant="outline" className={BADGE_CLASS}>
            {verse.era.name}
          </Badge>
          <button
            type="button"
            data-copy-verse={verseCopyText(verse)}
            data-copied-label={FEELING_TEXTS.verseCopied}
            aria-label={FEELING_TEXTS.copyVerse}
            title={FEELING_TEXTS.copyVerse}
            className="group relative z-10 flex size-8 items-center justify-center rounded-sm text-text-subtle focus-ring transition-colors hover:text-text"
          >
            <Copy
              aria-hidden="true"
              size={16}
              className="h-4 w-4 transition-opacity duration-300 group-data-copied:opacity-0 group-data-copied:duration-0"
            />
            <Check
              aria-hidden="true"
              size={16}
              className="absolute h-4 w-4 text-highlight opacity-0 group-data-copied:animate-copy-check motion-reduce:group-data-copied:animate-none motion-reduce:group-data-copied:opacity-100"
            />
          </button>
        </div>
      </div>
    </li>
  );
}
