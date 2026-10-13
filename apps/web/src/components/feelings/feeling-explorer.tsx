import { useEffect, useRef, useState } from 'react';

import { FeelingVerseItem } from '@/components/feelings/feeling-verse-item';
import { IslandErrorBoundary } from '@/components/island-error-boundary';
import { ErrorState } from '@/components/ui-extended/error-state';
import { TYPE } from '@/lib/constants/design-tokens';
import { FEELING_VERSES } from '@/lib/feelings/feeling-verses';
import {
  FONT_SIZE_BY_DEPTH,
  STEM_TOP_Y,
  TRUNK_LABEL_Y,
  edgePath,
  layoutUpright,
  type UprightLayout,
} from '@/lib/feelings/upright-layout';
import { cn } from '@/lib/utils';

import type { KeyboardEvent } from 'react';

type Status = 'chosen' | 'next' | 'sibling' | 'near' | 'far' | 'resting';

const LABEL_CLASS = {
  chosen: 'fill-highlight',
  next: 'fill-text hover:fill-highlight',
  sibling: 'fill-text opacity-55 hover:fill-highlight hover:opacity-100',
  near: 'fill-text opacity-30 hover:fill-highlight hover:opacity-100',
  far: 'fill-text opacity-10 hover:opacity-60',
  resting: 'fill-text hover:fill-highlight',
} as const satisfies Record<Status, string>;

const EDGE_CLASS = {
  chosen: 'stroke-highlight [stroke-width:2]',
  next: 'stroke-text-subtle opacity-85',
  sibling: 'stroke-text-subtle opacity-45',
  near: 'stroke-text-subtle opacity-25',
  far: 'stroke-text-subtle opacity-10',
  resting: 'stroke-text-subtle opacity-50',
} as const satisfies Record<Status, string>;

const TRUNK_LABEL = 'بمَ تشعر؟';
const TRUNK_FONT_SIZE = 26;

const startsWith = (path: readonly number[], prefix: readonly number[]): boolean =>
  prefix.length <= path.length && prefix.every((value, index) => path[index] === value);

function statusOf(nodePath: readonly number[], path: readonly number[]): Status {
  if (startsWith(path, nodePath)) return 'chosen';
  const parent = nodePath.slice(0, -1);
  if (startsWith(path, parent)) return parent.length === path.length ? 'next' : 'sibling';
  if (path.length === 0) return 'resting';
  return nodePath[0] === path[0] ? 'near' : 'far';
}

const onActivate =
  (action: () => void) =>
  (event: KeyboardEvent<SVGTextElement>): void => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    action();
  };

type FeelingTreeProps = {
  readonly layout: UprightLayout;
  readonly path: readonly number[];
  readonly onChoose: (path: readonly number[]) => void;
  readonly onReset: () => void;
  readonly className: string;
};

function FeelingTree({ layout, path, onChoose, onReset, className }: FeelingTreeProps) {
  const { viewBox } = layout;
  return (
    <svg
      viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
      direction="rtl"
      role="group"
      aria-label="شجرة المشاعر"
      className={cn('h-auto w-full select-none', className)}
    >
      <g
        style={{
          transform: layout.transform,
          transformOrigin: '0 0',
          transformBox: 'view-box',
        }}
        className="motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out"
      >
        <path
          d={`M0 ${STEM_TOP_Y} L0 0`}
          fill="none"
          strokeLinecap="round"
          className="stroke-highlight [stroke-width:2]"
        />
        {layout.items.map((item) => (
          <path
            key={item.key}
            d={edgePath(item)}
            fill="none"
            pathLength={1}
            strokeDasharray={1}
            strokeLinecap="round"
            style={{ animationDelay: `${item.depth === 1 ? 0 : 120}ms` }}
            className={cn(
              'transition-opacity duration-500 motion-safe:animate-feeling-draw',
              EDGE_CLASS[statusOf(item.path, path)]
            )}
          />
        ))}
        {layout.items.map((item) => {
          const status = statusOf(item.path, path);
          const choose = () => onChoose(item.path);
          return (
            <text
              key={item.key}
              x={item.point.x}
              y={item.point.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={FONT_SIZE_BY_DEPTH[item.depth]}
              strokeWidth={6}
              strokeLinejoin="round"
              role="button"
              tabIndex={0}
              aria-pressed={status === 'chosen'}
              onClick={choose}
              onKeyDown={onActivate(choose)}
              style={{
                paintOrder: 'stroke',
                animationDelay: `${item.depth === 1 ? 250 : 380}ms`,
              }}
              className={cn(
                'cursor-pointer stroke-surface transition-[opacity,fill] duration-500 outline-none focus-visible:underline',
                'motion-safe:animate-feeling-fade',
                LABEL_CLASS[status]
              )}
            >
              {item.name}
            </text>
          );
        })}
        <text
          x={0}
          y={TRUNK_LABEL_Y}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={TRUNK_FONT_SIZE}
          role="button"
          tabIndex={0}
          aria-label="من جديد"
          onClick={onReset}
          onKeyDown={onActivate(onReset)}
          className="cursor-pointer fill-text-muted outline-none hover:fill-text focus-visible:underline"
        >
          {TRUNK_LABEL}
        </text>
      </g>
    </svg>
  );
}

function FeelingPicker() {
  const [path, setPath] = useState<readonly number[]>([]);
  const resultRef = useRef<HTMLDivElement>(null);

  const wide = layoutUpright(path, false);
  const narrow = layoutUpright(path, true);
  const chosen = wide.items.filter((item) => startsWith(path, item.path));
  const names = chosen.map((item) => item.name);
  const isComplete = names.length === 3;
  const preciseSlug = isComplete ? (chosen.at(-1)?.slug ?? '') : '';
  const verses = FEELING_VERSES[preciseSlug] ?? [];

  useEffect(() => {
    if (preciseSlug === '') return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    resultRef.current?.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'nearest',
    });
  }, [preciseSlug]);

  const reset = () => setPath([]);

  return (
    <div className="flex flex-col gap-8">
      <div className="@container">
        <FeelingTree
          layout={wide}
          path={path}
          onChoose={setPath}
          onReset={reset}
          className="hidden @min-[560px]:block"
        />
        <FeelingTree
          layout={narrow}
          path={path}
          onChoose={setPath}
          onReset={reset}
          className="@min-[560px]:hidden"
        />
      </div>

      <div ref={resultRef} aria-live="polite">
        {isComplete && (
          <div
            key={preciseSlug}
            className="flex flex-col gap-3 border-t border-border pt-8 motion-safe:animate-feeling-fade"
          >
            <p className={cn(TYPE.caption, 'text-text-subtle')}>{names.join(' ← ')}</p>
            <p className={cn(TYPE.heading, 'text-highlight')}>{names.at(-1)}</p>
            {verses.length > 0 ? (
              <ul className="flex flex-col">
                {verses.map((verse) => (
                  <FeelingVerseItem key={`${verse.poem}:${verse.row}`} verse={verse} />
                ))}
              </ul>
            ) : (
              <p className={cn(TYPE.body, 'text-text-muted')}>لم نجد لهذا الشعور أبياتًا بعد.</p>
            )}
            <p className={cn(TYPE.caption, 'text-text-subtle')}>
              اختيرت هذه الأبيات من نتائج البحث عن الكلمة نفسها، لا عن معناها، فقد تفوتها أبيات تعبّر
              عن الشعور بألفاظ أخرى.
            </p>
            <button
              type="button"
              onClick={reset}
              className={cn(
                TYPE.body,
                'self-start rounded-sm text-text-muted underline underline-offset-4 focus-ring hover:text-text'
              )}
            >
              من جديد
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function FeelingExplorer() {
  return (
    <IslandErrorBoundary
      feature="feelings"
      fallback={<ErrorState onRetry={() => window.location.reload()} />}
    >
      <FeelingPicker />
    </IslandErrorBoundary>
  );
}
