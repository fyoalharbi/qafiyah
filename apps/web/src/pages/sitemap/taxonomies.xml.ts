import { SITE_URL } from '@/lib/constants/config';
import { loadTaxonomyIndex } from '@/lib/seo/taxonomy-pages';
import { CACHE_SITEMAP } from '@/lib/server/cache';
import { urlsetXml } from '@/lib/server/sitemap';
import { taxonomyIndexUrl, taxonomyUrl, type TaxonomySection } from '@/lib/urls';

import type { APIRoute } from 'astro';

const TAXONOMY_SECTIONS: readonly TaxonomySection[] = ['meters', 'rhymes', 'themes', 'collections'];

export const GET: APIRoute = async () => {
  const bySection = await Promise.all(
    TAXONOMY_SECTIONS.map(async (section) => {
      const terms = await loadTaxonomyIndex(section);
      return [
        `${SITE_URL}${taxonomyIndexUrl(section)}`,
        ...terms.map((term) => `${SITE_URL}${taxonomyUrl(section, term.slug)}`),
      ];
    })
  );
  return new Response(urlsetXml(bySection.flat()), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': CACHE_SITEMAP },
  });
};
