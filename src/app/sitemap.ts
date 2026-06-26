import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://zen-job-hunt.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url:              SITE_URL,
      lastModified:     now,
      changeFrequency:  'daily',
      priority:         1,
    },
    {
      url:              `${SITE_URL}/login`,
      lastModified:     now,
      changeFrequency:  'monthly',
      priority:         0.5,
    },
    {
      url:              `${SITE_URL}/signup`,
      lastModified:     now,
      changeFrequency:  'monthly',
      priority:         0.6,
    },
    {
      url:              `${SITE_URL}/jobs`,
      lastModified:     now,
      changeFrequency:  'hourly',
      priority:         0.9,
    },
    {
      url:              `${SITE_URL}/scholarships`,
      lastModified:     now,
      changeFrequency:  'daily',
      priority:         0.9,
    },
    {
      url:              `${SITE_URL}/dashboard`,
      lastModified:     now,
      changeFrequency:  'daily',
      priority:         0.7,
    },
  ];

  return staticPages;
}