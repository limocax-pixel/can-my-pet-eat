// Site-wide settings. SITE_URL can be overridden at build time, e.g. when the
// site moves to a custom domain: SITE_URL=https://tools.jomizoo.com npm run build
export const SITE_URL = (process.env.SITE_URL || 'https://limocax-pixel.github.io/jomizoo-can-eat').replace(/\/$/, '');
export const BASE = new URL(SITE_URL + '/').pathname; // "/jomizoo-can-eat/" or "/"

export const SITE = {
  name: 'Can My Pet Eat This?',
  tagline: 'Sourced food-safety answers for hamsters, budgies and cockatiels',
  repo: 'https://github.com/limocax-pixel/jomizoo-can-eat',
  lang: 'en',
};

export const BRAND = {
  name: 'JOMIZOO',
  url: 'https://jomizoo.com/',
  motto: 'Love & health for small pets',
  about:
    'JOMIZOO is a small-pet brand from Japan. We make paper bedding for hamsters and small animals, and travel carriers for hamsters and small birds.',
  sameAs: [
    'https://jomizoo.com/',
    'https://x.com/JOMIZOO_PET',
    'https://www.instagram.com/jomizoo_pet/',
  ],
};

export const VERDICTS = {
  yes: { label: 'Yes', long: 'Yes — safe in normal portions', scale: 'Safe as a regular part of the diet in sensible portions.' },
  limit: { label: 'Small amounts', long: 'Yes, in small amounts', scale: 'Safe only as an occasional treat or in small amounts.' },
  avoid: { label: 'Better not', long: 'Better not', scale: 'Not acutely toxic, but unsuitable. Don’t offer it on purpose; a tiny accidental bite is not an emergency.' },
  no: { label: 'Never', long: 'No — never feed', scale: 'Toxic or dangerous. Never feed it, and call a vet if your pet has eaten some.' },
};
export const VERDICT_ORDER = ['yes', 'limit', 'avoid', 'no'];
