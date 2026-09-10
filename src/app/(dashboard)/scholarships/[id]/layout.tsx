import type { Metadata } from 'next';

const API_URL  = process.env.NEXT_PUBLIC_API_URL  || 'https://zen-job-hunt.vercel.app/api';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://zen-job-hunt.vercel.app';

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const res = await fetch(`${API_URL}/scholarships/${params.id}`, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error('not found');
    const s   = await res.json();

    const title = `${s.title}${s.provider ? ` — ${s.provider}` : ''} | ZenithJobs`;
    const desc  =
      (s.description?.slice(0, 155)) ||
      `Apply for the ${s.title} scholarship${s.provider ? ` by ${s.provider}` : ''} on ZenithJobs. ` +
      `${s.deadline ? 'Deadline: ' + s.deadline + '.' : ''} ${s.amount || ''}`.trim();

    return {
      title,
      description: desc,
      alternates: { canonical: `${SITE_URL}/scholarships/${params.id}` },
      openGraph: {
        title,
        description: desc,
        url:   `${SITE_URL}/scholarships/${params.id}`,
        type:  'article',
      },
      twitter: { card: 'summary', title, description: desc },
    };
  } catch {
    return {
      title: 'Scholarship | ZenithJobs',
      description: 'View and apply for this scholarship on ZenithJobs.',
    };
  }
}

export default function ScholarshipDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}