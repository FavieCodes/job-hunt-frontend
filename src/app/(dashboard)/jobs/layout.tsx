import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://zen-job-hunt.vercel.app';

export const metadata: Metadata = {
  title: 'Browse Remote Jobs — Nigeria, Africa & Worldwide',
  description:
    'Find 2,000+ remote and on-site job listings in Nigeria, Africa and globally. ' +
    'Filter by role, country, job type and salary. Updated daily from top job boards.',
  keywords: [
    'remote jobs Nigeria', 'jobs in Nigeria 2025', 'Nigeria job board',
    'tech jobs Africa', 'software developer jobs Nigeria', 'full stack Nigeria',
    'online jobs Africa', 'work from home jobs Nigeria', 'remote work Africa',
    'developer jobs Lagos', 'IT jobs Nigeria', 'engineering jobs Africa',
  ],
  alternates: { canonical: `${SITE_URL}/jobs` },
  openGraph: {
    title:       'Browse 2,000+ Remote Jobs | ZenJobHunt',
    description: 'Find remote and on-site jobs in Nigeria, Africa and worldwide. Updated daily.',
    url:         `${SITE_URL}/jobs`,
    type:        'website',
  },
  twitter: {
    card:        'summary',
    title:       'Browse 2,000+ Remote Jobs | ZenJobHunt',
    description: 'Find remote and on-site jobs in Nigeria, Africa and worldwide.',
  },
};

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}