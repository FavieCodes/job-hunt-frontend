import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://zen-job-hunt.vercel.app';

export const metadata: Metadata = {
  title: 'Scholarships for Nigerians & Africans — 2025 & 2026',
  description:
    'Discover fully funded scholarships for Nigerians, Africans and international students. ' +
    'Browse 500+ scholarships with deadlines, amounts, and direct application links.',
  keywords: [
    'scholarships for Nigerians', 'scholarships Nigeria 2025', 'scholarships Nigeria 2026',
    'fully funded scholarships Africa', 'African scholarships', 'scholarships for Africans',
    'undergraduate scholarships Nigeria', 'masters scholarships Africa',
    'PhD scholarships Nigeria', 'international scholarships Nigeria',
    'Commonwealth scholarships', 'Chevening scholarship', 'DAAD scholarship Nigeria',
    'scholarship opportunities Africa', 'study abroad Nigeria',
  ],
  alternates: { canonical: `${SITE_URL}/scholarships` },
  openGraph: {
    title:       'Scholarships for Nigerians & Africans | ZenJobHunt',
    description: '500+ fully funded scholarships for Nigerians and Africans. Updated daily.',
    url:         `${SITE_URL}/scholarships`,
    type:        'website',
  },
  twitter: {
    card:        'summary',
    title:       'Scholarships for Nigerians & Africans | ZenJobHunt',
    description: '500+ fully funded scholarships. Browse deadlines and apply directly.',
  },
};

export default function ScholarshipsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}