export interface ExperienceEntry {
  id: string; title: string; company: string; location: string;
  startDate: string; endDate: string; current: boolean; bullets: string;
}

export interface EducationEntry {
  id: string; degree: string; institution: string; location: string;
  startDate: string; endDate: string; gpa: string;
}

export interface ProjectEntry {
  id: string; name: string; description: string; technologies: string;
  github_url: string; live_url: string 
}

export interface ResumeForm {
  title: string; fullName: string; email: string; phone: string;
  location: string; linkedin: string; github: string; website: string; summary: string;
  skills: string; experience: ExperienceEntry[]; education: EducationEntry[];
  projects: ProjectEntry[]; certifications: string; languages: string;
}

export interface SavedResume {
  id: string; title: string; resume_type: 'generated' | 'tailored';
  created_at: string; generated_html: string;
}

export type ActiveTab = 'build' | 'tailor' | 'history';