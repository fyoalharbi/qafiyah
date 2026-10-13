import { INLINE_LINK, TYPE } from '@/lib/constants/design-tokens';
import { highlightedTerms, splitHighlightedParts } from '@/lib/search/highlighted-terms';
import { poemUrl } from '@/lib/urls';
import { cn } from '@/lib/utils';

import type { FeelingVerse } from '@/lib/feelings/feeling-verses';

type Segment = { readonly id: string; readonly text: string; readonly marked: boolean };
type Hemistich = { readonly id: string; readonly segments: readonly Segment[] };

function hemistichsOf(row: string): readonly Hemistich[] {
  const hemistichs: Segment[][] = [[]];
  splitHighlightedParts(row).forEach((part, partIndex) => {
    part.split('*').forEach((text, index) => {
      if (index > 0) hemistichs.push([]);
      if (text.trim() === '') return;
      hemistichs.at(-1)?.push({ id: `${partIndex}:${index}`, text, marked: partIndex % 2 === 1 });
    });
  });
  return hemistichs
    .filter((segments) => segments.length > 0)
    .map((segments) => ({ id: segments.map((segment) => segment.id).join('|'), segments }));
}

export function FeelingVerseItem({ verse }: { readonly verse: FeelingVerse }) {
  return (
    <li className="flex flex-col gap-1.5 border-b border-border py-5 last:border-b-0">
      <p className={cn(TYPE.subheading, 'flex flex-wrap gap-x-11 leading-loose text-text')}>
        {hemistichsOf(verse.row).map((hemistich) => (
          <span key={hemistich.id}>
            {hemistich.segments.map((segment) =>
              segment.marked ? (
                <mark key={segment.id} className="rounded-sm bg-highlight/15 text-inherit">
                  {segment.text}
                </mark>
              ) : (
                <span key={segment.id}>{segment.text}</span>
              )
            )}
          </span>
        ))}
      </p>
      <p className={cn(TYPE.caption, 'flex flex-wrap gap-x-3.5 text-text-muted')}>
        <span>{verse.poet}</span>
        <span>{verse.era}</span>
        <a href={poemUrl(verse.poem, highlightedTerms(verse.row))} className={INLINE_LINK}>
          {verse.title}
        </a>
      </p>
    </li>
  );
}
