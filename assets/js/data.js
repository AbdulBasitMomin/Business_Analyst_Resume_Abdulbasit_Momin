/**
 * SINGLE SOURCE OF TRUTH for all resume content.
 * Every section of the site renders from this object -- edit here, nowhere else.
 *
 * While `isPlaceholder` is true the site shows a visible draft banner so the
 * link can never be mistaken for a finished profile. Flip it to false once the
 * real content below is in place.
 */
export const isPlaceholder = true;

export const resume = {
  meta: {
    name: 'Abdul Basit Momin',
    role: 'Business Analyst',
    tagline: 'TODO — one line on what you do and the value you create',
    location: 'TODO — City, Country',
    email: 'TODO@example.com',
    phone: '',
    linkedin: '',
    github: 'https://github.com/AbdulBasitMomin',
    resumePdf: '',
    availability: 'TODO — e.g. Open to Business Analyst roles',
  },

  /** Big animated counters under the hero. Keep to 3-4. */
  stats: [
    { value: 0, suffix: '+', label: 'Years in analysis' },
    { value: 0, suffix: '+', label: 'Projects delivered' },
    { value: 0, suffix: '+', label: 'Stakeholders partnered' },
    { value: 0, suffix: '%', label: 'Process efficiency gained' },
  ],

  about: {
    headline: 'TODO — short positioning statement',
    paragraphs: [
      'TODO — paragraph one: who you are, your domain, the kinds of problems you solve.',
      'TODO — paragraph two: how you work (elicitation, data, stakeholder management) and what outcomes follow.',
    ],
  },

  /**
   * Roles render as a 3D depth timeline. Most recent first.
   * `end: 'Present'` renders as a live/current badge.
   */
  experience: [
    {
      role: 'TODO — Job Title',
      company: 'TODO — Company',
      location: 'TODO — City',
      start: 'MON YYYY',
      end: 'Present',
      summary: 'TODO — one sentence framing the scope and business context of this role.',
      achievements: [
        'TODO — achievement with a number attached (what you did, how, the measurable result).',
        'TODO — achievement two.',
        'TODO — achievement three.',
      ],
      tools: ['TODO', 'TODO', 'TODO'],
    },
  ],

  /** Grouped skill bars. Level 0-100. */
  skills: [
    {
      group: 'Analysis & Requirements',
      items: [
        { name: 'Requirements Elicitation', level: 0 },
        { name: 'BRD / FRD / User Stories', level: 0 },
        { name: 'Process Mapping (BPMN)', level: 0 },
        { name: 'Gap & Root Cause Analysis', level: 0 },
      ],
    },
    {
      group: 'Data & Reporting',
      items: [
        { name: 'SQL', level: 0 },
        { name: 'Power BI / Tableau', level: 0 },
        { name: 'Excel (Advanced)', level: 0 },
        { name: 'Python (pandas)', level: 0 },
      ],
    },
    {
      group: 'Delivery & Tools',
      items: [
        { name: 'Jira / Confluence', level: 0 },
        { name: 'Agile / Scrum', level: 0 },
        { name: 'UAT & Test Planning', level: 0 },
        { name: 'Stakeholder Management', level: 0 },
      ],
    },
  ],

  /** Labels that orbit inside the draggable 3D skill sphere. 18-30 works best. */
  skillCloud: [
    'SQL', 'Power BI', 'Tableau', 'Excel', 'Python', 'Jira', 'Confluence',
    'BPMN', 'User Stories', 'BRD', 'FRD', 'UAT', 'Agile', 'Scrum', 'Kanban',
    'Stakeholder Mgmt', 'Data Modeling', 'Wireframing', 'A/B Testing',
    'KPI Design', 'Gap Analysis', 'Process Mapping', 'Figma', 'Salesforce',
  ],

  projects: [
    {
      name: 'TODO — Project name',
      blurb: 'TODO — the problem and what you built or changed.',
      impact: 'TODO — the quantified outcome.',
      tags: ['TODO', 'TODO'],
      link: '',
    },
  ],

  education: [
    {
      degree: 'TODO — Degree',
      school: 'TODO — University',
      location: 'TODO — City',
      start: 'YYYY',
      end: 'YYYY',
      detail: 'TODO — GPA, honours, or relevant coursework.',
    },
  ],

  certifications: [
    { name: 'TODO — Certification', issuer: 'TODO — Issuer', year: 'YYYY', link: '' },
  ],

  /** Optional. Leave the array empty to hide the section entirely. */
  testimonials: [],
};
