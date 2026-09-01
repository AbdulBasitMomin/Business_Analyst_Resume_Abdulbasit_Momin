/**
 * Everything the portfolio page says, read from the resume's single source of
 * truth. The reference this page is built from carries a fictional person:
 * twenty years of experience, ninety-five projects, a Dribbble account and a
 * journal. None of that is here. Where the reference had a section with no
 * truthful equivalent, the section carries real work instead -- the journal
 * became the method, the visual playground became the deliverables -- and
 * where it had a number, the number comes from data.js with the resume line it
 * came from attached.
 */
import { resume } from '@resume';

export const meta = resume.meta;

/** The loading screen's rotating words: the first three delivery stages. */
export const LOADING_WORDS = ['Elicit', 'Specify', 'Validate'];

export const EYEBROW = `${meta.role} · ${meta.location}`;

/**
 * The reference cycles job titles here. Cycling titles would be claiming them,
 * so this cycles the four skill groups the resume actually lists, inside a
 * sentence that stays true whichever one is showing.
 */
export const FOCUS_AREAS = [
  'requirements & analysis',
  'data & reporting',
  'governance & data quality',
  'testing & delivery',
];

export const NAV = [
  { label: 'Work', href: '#work' },
  { label: 'Method', href: '#method' },
  { label: 'Resume', href: `https://${meta.portfolio}/` },
];

/**
 * Where a work card goes when you click it.
 *
 * The resume site renders a full problem / what-I-did / result breakdown for
 * each of these under its own anchor, which is a better destination than the
 * projects section as a whole. Aligned to resume.projects by order;
 * check-portfolio.mjs asserts each id still exists in evidence.js, so a rename
 * there fails a check rather than shipping a link to nowhere.
 */
const CASE_ANCHORS = ['cs-platform', 'cs-reporting', 'cs-uat'];

export const PROJECTS = resume.projects.map((p, i) => ({
  ...p,
  cover: i,
  href: `https://${meta.portfolio}/#${CASE_ANCHORS[i]}`,
}));

export const METHOD = resume.process;

/** Six of the fourteen artefact types the resume lists. */
export const DELIVERABLES = [
  'User stories & acceptance criteria',
  'Requirements traceability',
  'Source-to-target validation',
  'UAT plans & test cases',
  'Power BI dashboards',
  'Data governance artefacts',
];

/** Three of the four figures, each carrying the line it came from. */
export const STATS = [resume.stats[0], resume.stats[2], resume.stats[3]];

export const DELIVERABLE_COUNT = resume.deliverables.length;
export const ROLE_COUNT = resume.experience.length;

export const MARQUEE = 'REQUIREMENTS THAT SURVIVE THE HANDOFF';

export const PDF = `https://${meta.portfolio}/${meta.resumePdf.replace(/^\.\//, '')}`;
export const TEL = `tel:${meta.phone.replace(/[^\d+]/g, '')}`;
export const MAILTO = `mailto:${meta.email}`;

export const SOCIALS = [
  { label: 'LinkedIn', href: meta.linkedin },
  { label: 'GitHub', href: meta.github },
  { label: 'Email', href: MAILTO },
];
