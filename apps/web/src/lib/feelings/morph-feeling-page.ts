import { Idiomorph } from 'idiomorph';

const LEAVE_STYLE = 'opacity:0;transition:opacity 300ms ease-out;pointer-events:none';
const LEAVE_MS = 300;

const isFeelingPath = (url: URL): boolean =>
  url.pathname === '/feelings' || url.pathname.startsWith('/feelings/');

export const isFeelingNavigation = (from: URL, to: URL): boolean =>
  isFeelingPath(from) && isFeelingPath(to);

function fadeOutBeforeRemoving(node: Node): boolean {
  if (!(node instanceof SVGElement) || !Object.hasOwn(node.dataset, 'feelingNode')) return true;
  node.removeAttribute('id');
  node.setAttribute('aria-hidden', 'true');
  node.setAttribute('style', `${node.getAttribute('style') ?? ''};${LEAVE_STYLE}`);
  setTimeout(() => node.remove(), LEAVE_MS);
  return false;
}

export function morphMain(doc: Document): void {
  const next = doc.querySelector('#main');
  const main = document.querySelector('#main');
  if (next === null || main === null) return;
  void Idiomorph.morph(main, next, {
    callbacks: { beforeNodeRemoved: fadeOutBeforeRemoving },
  });
}
