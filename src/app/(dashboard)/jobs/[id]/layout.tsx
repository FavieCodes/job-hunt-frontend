import type { Metadata } from 'next';

const API_URL  = process.env.NEXT_PUBLIC_API_URL  || 'https://zen-job-hunt.vercel.app/api';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://zen-job-hunt.vercel.app';

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const res  = await fetch(`${API_URL}/jobs/${params.id}`, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error('not found');
    const job  = await res.json();

    const title = `${job.title}${job.company ? ` at ${job.company}` : ''} — ZenithJobs`;
    const desc  =
      (job.description?.slice(0, 155)) ||
      `Apply for ${job.title}${job.company ? ` at ${job.company}` : ''} on ZenithJobs. ` +
      `${job.job_type ? job.job_type + ' position.' : ''} ${job.country || ''}`.trim();

    return {
      title,
      description: desc,
      alternates: { canonical: `${SITE_URL}/jobs/${params.id}` },
      openGraph: {
        title,
        description: desc,
        url:   `${SITE_URL}/jobs/${params.id}`,
        type:  'article',
      },
      twitter: { card: 'summary', title, description: desc },
    };
  } catch {
    return {
      title: 'Job Listing | ZenithJobs',
      description: 'View and apply for this job on ZenithJobs.',
    };
  }
}

export default function JobDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}