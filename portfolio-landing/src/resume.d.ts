// assets/js/data.js is plain JavaScript with no types of its own. This declares
// the shape the landing page actually reads, so a rename in data.js fails the
// build here rather than rendering `undefined` on the page.
declare module '@resume' {
  export interface Stat {
    value: number;
    suffix: string;
    label: string;
    source: string;
  }
  export interface Certification {
    name: string;
    issuer: string;
    year: string;
    link: string;
    status?: string;
  }
  export interface Role {
    role: string;
    company: string;
    short: string;
    location: string;
    start: string;
    end: string;
    achievements: string[];
    tools: string[];
  }
  export interface Project {
    name: string;
    blurb: string;
    impact: string;
    tags: string[];
    link: string;
  }
  export interface Stage {
    stage: string;
    blurb: string;
    artifacts: string[];
  }
  export const resume: {
    meta: {
      name: string;
      role: string;
      tagline: string;
      location: string;
      email: string;
      phone: string;
      linkedin: string;
      github: string;
      resumePdf: string;
      availability: string;
      portfolio: string;
    };
    stats: Stat[];
    about: { headline: string; paragraphs: string[] };
    experience: Role[];
    deliverables: string[];
    projects: Project[];
    process: Stage[];
    certifications: Certification[];
  };
  export const isPlaceholder: boolean;
}
