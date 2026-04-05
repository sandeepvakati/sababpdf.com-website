import { ALL_TOOLS } from '../lib/toolsList';

const staticRoutes = ['', '/about', '/privacy', '/terms', '/contact'];

export default function sitemap() {
  const now = new Date();

  return [
    ...staticRoutes.map((route) => ({
      url: `https://sababpdf.com${route}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: route === '' ? 1 : 0.7,
    })),
    ...ALL_TOOLS.map((tool) => ({
      url: `https://sababpdf.com${tool.href}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    })),
  ];
}
