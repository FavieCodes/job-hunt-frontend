import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://zen-job-hunt.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent:  '*',
        allow:      '/',
        disallow:   [
          '/api/',
          '/dashboard/admin/',
          '/dashboard/profile',
          '/dashboard/saved',
          '/dashboard/applications',
          '/dashboard/resume',
          '/dashboard/portfolio',
          '/dashboard/interview',
          '/check-email',
          '/confirm',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow:     ['/jobs', '/scholarships', '/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}