/**
 * Evidence layer: what turns a skills list into proof.
 *
 * Each capability carries the roles it was used in and a quotation from the
 * source resume. `sourced: 'listed'` marks a capability that appears in the
 * resume's skills section but has no supporting achievement bullet -- shown
 * honestly as "listed, no bullet" rather than dressed up with invented detail.
 */

export const CATEGORIES = ['Business analysis', 'Data', 'AI', 'Delivery', 'Systems', 'Tools'];

const M = { company: 'Mercor', role: 'AI Evaluator' };
const B = { company: 'BodyWellnessAI', role: 'Product Owner / Business Analyst' };
const S = { company: 'Sarjen Systems', role: 'Business Analyst, IT Consulting' };

export const capabilities = [
  // --- Business analysis ---
  { name: 'Requirements gathering & prioritisation', cat: 'Business analysis', sourced: 'bullet', evidence: [
    { ...S, quote: 'Gathered, analyzed, and prioritized business, functional, data, and technical requirements.' }] },
  { name: 'Stakeholder facilitation', cat: 'Business analysis', sourced: 'bullet', evidence: [
    { ...S, quote: 'Facilitating stakeholder discussions to define use cases, KPIs, and success criteria.' }] },
  { name: 'User stories & acceptance criteria', cat: 'Business analysis', sourced: 'bullet', evidence: [
    { ...B, quote: 'Translated business needs into user stories, acceptance criteria, process flows, and business rules.' }] },
  { name: 'Functional specifications', cat: 'Business analysis', sourced: 'bullet', evidence: [
    { ...B, quote: 'Owned requirements and functional specifications for a consumer data platform covering 50+ conditions.' }] },
  { name: 'Process flows & business rules', cat: 'Business analysis', sourced: 'bullet', evidence: [
    { ...B, quote: 'Translated business needs into … process flows, and business rules.' }] },
  { name: 'Use case & KPI definition', cat: 'Business analysis', sourced: 'bullet', evidence: [
    { ...S, quote: 'Define use cases, KPIs, and success criteria.' }] },
  { name: 'Personas & journey maps', cat: 'Business analysis', sourced: 'bullet', evidence: [
    { ...B, quote: 'Including user personas and end-to-end journey maps that drove personalization and segmentation logic.' }] },
  { name: 'Root-cause analysis', cat: 'Business analysis', sourced: 'bullet', evidence: [
    { ...B, quote: 'Validated outputs with data checks and root-cause analysis, tracking issues to resolution.' }] },

  // --- Data ---
  { name: 'SQL', cat: 'Data', sourced: 'bullet', evidence: [
    { ...S, quote: 'Built 8 Power BI dashboards using SQL and data extracts.' }] },
  { name: 'Power BI', cat: 'Data', sourced: 'bullet', evidence: [
    { ...S, quote: 'Built 8 Power BI dashboards … giving leadership a real-time view of delivery and performance.' }] },
  { name: 'Data mapping & schema docs', cat: 'Data', sourced: 'bullet', evidence: [
    { ...S, quote: 'Document data sources, schemas, mappings, integration points, APIs, and business rules.' }] },
  { name: 'Source-to-target validation', cat: 'Data', sourced: 'bullet', evidence: [
    { ...S, quote: 'Checking ingestion, transformation logic, and field-level mappings against requirements.' }] },
  { name: 'Reconciliation', cat: 'Data', sourced: 'bullet', evidence: [
    { ...S, quote: 'Supporting reconciliation and business sign-off.' }] },
  { name: 'Data quality controls', cat: 'Data', sourced: 'bullet', evidence: [
    { ...S, quote: 'Documented data governance artifacts (quality controls, privacy, consent, lineage, data flows).' }] },
  { name: 'Data lineage', cat: 'Data', sourced: 'bullet', evidence: [
    { ...S, quote: 'Documented data governance artifacts (… lineage, data flows) in Jira and Confluence.' }] },
  { name: 'Privacy, consent & compliance', cat: 'Data', sourced: 'bullet', evidence: [
    { ...S, quote: 'Documented data governance artifacts (… privacy, consent …) across regulated deliveries.' }] },
  { name: 'Audience & segmentation logic', cat: 'Data', sourced: 'bullet', evidence: [
    { ...B, quote: 'Defined and validated audience and segmentation logic using customer, behavioral, and engagement data.' }] },
  { name: 'Excel (advanced)', cat: 'Data', sourced: 'listed', evidence: [] },

  // --- AI --- scoped strictly to the evaluator role and the certification
  { name: 'AI output evaluation', cat: 'AI', sourced: 'bullet', evidence: [
    { ...M, quote: 'Evaluate and score AI model outputs on business and data tasks against defined rubrics, checking accuracy, reasoning, and instruction adherence.' }] },
  { name: 'Rubric design & scoring', cat: 'AI', sourced: 'bullet', evidence: [
    { ...M, quote: 'Score AI model outputs … against defined rubrics.' }] },
  { name: 'Prompt-variation testing', cat: 'AI', sourced: 'bullet', evidence: [
    { ...M, quote: 'Test prompt variations and document failure patterns to tighten quality benchmarks and improve reliability.' }] },
  { name: 'Failure-pattern documentation', cat: 'AI', sourced: 'bullet', evidence: [
    { ...M, quote: 'Document failure patterns to tighten quality benchmarks.' }] },
  { name: 'AI fluency (certified)', cat: 'AI', sourced: 'cert', evidence: [
    { company: 'Anthropic Academy', role: 'Certification', quote: 'AI Fluency: Framework and Foundations.' }] },

  // --- Delivery ---
  { name: 'Backlog management', cat: 'Delivery', sourced: 'bullet', evidence: [
    { ...B, quote: 'Managed and prioritized the backlog across multiple release cycles.' }] },
  { name: 'Release-cycle delivery', cat: 'Delivery', sourced: 'bullet', evidence: [
    { ...B, quote: 'Across multiple release cycles.' },
    { ...S, quote: 'Supporting defect-free go-lives across 7+ deployments.' }] },
  { name: 'UAT (end to end)', cat: 'Delivery', sourced: 'bullet', evidence: [
    { ...S, quote: 'Led UAT end to end (test case development, execution, defect tracking) plus production validation.' }] },
  { name: 'Test cases & defect tracking', cat: 'Delivery', sourced: 'bullet', evidence: [
    { ...S, quote: 'Test case development, execution, defect tracking.' }] },
  { name: 'Agile project management (certified)', cat: 'Delivery', sourced: 'cert', evidence: [
    { company: 'HP LIFE', role: 'Certification', quote: 'Agile Project Management.' }] },
  { name: 'Integration & A/B testing', cat: 'Delivery', sourced: 'listed', evidence: [
    { ...B, quote: 'Support audience creation, testing, and activation to downstream experiences.' }] },

  // --- Systems ---
  { name: 'API & integration documentation', cat: 'Systems', sourced: 'bullet', evidence: [
    { ...S, quote: 'Document … integration points, APIs, and business rules across regulated deliveries.' }] },
  { name: 'Customer data platforms (CDP)', cat: 'Systems', sourced: 'listed', evidence: [
    { ...B, quote: 'Owned requirements and functional specifications for a consumer data platform.' }] },
  { name: 'Measurement frameworks', cat: 'Systems', sourced: 'listed', evidence: [
    { ...B, quote: 'Improving segmentation accuracy and customer engagement over time.' }] },

  // --- Tools ---
  { name: 'Jira', cat: 'Tools', sourced: 'bullet', evidence: [
    { ...S, quote: 'Documented data governance artifacts … in Jira and Confluence.' }] },
  { name: 'Confluence', cat: 'Tools', sourced: 'bullet', evidence: [
    { ...S, quote: 'Documented data governance artifacts … in Jira and Confluence.' }] },
];

/**
 * Case studies, built from the roles the resume describes.
 *
 * The eight-stage frame is filled only where the resume supports it. Stages it
 * does not cover carry an explicit placeholder -- these are the gaps to fill
 * before sending the link to anyone.
 */
export const caseStudies = [
  {
    id: 'cs-platform',
    title: 'Consumer data platform: requirements & segmentation',
    org: 'BodyWellnessAI',
    role: 'Product Owner / Business Analyst',
    period: 'Jul 2025 – Apr 2026',
    tags: ['Requirements', 'Segmentation', 'Personas', 'Backlog'],
    stages: [
      { n: '01', k: 'Problem', v: 'A consumer platform spanning 50+ conditions needed personalisation logic that could be specified, built and defended.' },
      { n: '02', k: 'Discovery', v: '[ADD: how the need was surfaced — which stakeholders, what evidence]' },
      { n: '03', k: 'Requirements', v: 'Owned requirements and functional specifications, including user personas and end-to-end journey maps.' },
      { n: '04', k: 'Analysis', v: 'Defined and validated audience and segmentation logic using customer, behavioural and engagement data.' },
      { n: '05', k: 'Solution', v: 'Segmentation and personalisation logic driving audience creation, testing and activation to downstream experiences.' },
      { n: '06', k: 'Delivery', v: 'Translated needs into user stories, acceptance criteria, process flows and business rules; managed and prioritised the backlog across multiple release cycles.' },
      { n: '07', k: 'Validation', v: 'Validated outputs with data checks and root-cause analysis, tracking issues to resolution.' },
      { n: '08', k: 'Impact', v: 'Improved segmentation accuracy and customer engagement over time. [ADD: figure, if one can be shared]' },
    ],
  },
  {
    id: 'cs-reporting',
    title: 'Leadership reporting: 8 dashboards on a validated model',
    org: 'Sarjen Systems',
    role: 'Business Analyst, IT Consulting',
    period: 'Jan 2022 – Jun 2025',
    tags: ['SQL', 'Power BI', 'Reconciliation'],
    stages: [
      { n: '01', k: 'Problem', v: 'Leadership lacked a real-time view of delivery and performance to sign off against.' },
      { n: '02', k: 'Discovery', v: 'Facilitated stakeholder discussions to define use cases, KPIs and success criteria.' },
      { n: '03', k: 'Requirements', v: 'Gathered and prioritised business, functional, data and technical requirements.' },
      { n: '04', k: 'Analysis', v: 'Partnered with data architects and engineers to document sources, schemas, mappings, integration points and APIs.' },
      { n: '05', k: 'Solution', v: '8 Power BI dashboards built on SQL and data extracts.' },
      { n: '06', k: 'Delivery', v: '[ADD: delivery cadence and who consumed the dashboards day to day]' },
      { n: '07', k: 'Validation', v: 'Source-to-target validation of ingestion, transformation logic and field-level mappings against requirements.' },
      { n: '08', k: 'Impact', v: 'Gave leadership a real-time view and supported reconciliation and business sign-off.' },
    ],
  },
  {
    id: 'cs-uat',
    title: 'Regulated UAT and governance practice',
    org: 'Sarjen Systems',
    role: 'Business Analyst, IT Consulting',
    period: 'Jan 2022 – Jun 2025',
    tags: ['UAT', 'Defect tracking', 'Governance'],
    stages: [
      { n: '01', k: 'Problem', v: 'Regulated deliveries needed go-lives that held up to audit, not just to a test pass.' },
      { n: '02', k: 'Discovery', v: '[ADD: what was failing or at risk before this practice existed]' },
      { n: '03', k: 'Requirements', v: 'Requirements captured with the traceability and evidence a regulated delivery has to produce.' },
      { n: '04', k: 'Analysis', v: 'Documented governance artefacts: quality controls, privacy, consent, lineage and data flows.' },
      { n: '05', k: 'Solution', v: 'UAT run end to end — test case development, execution and defect tracking — plus production validation.' },
      { n: '06', k: 'Delivery', v: 'Artefacts maintained in Jira and Confluence; training delivered alongside.' },
      { n: '07', k: 'Validation', v: 'Production validation after each release, with defects tracked to resolution.' },
      { n: '08', k: 'Impact', v: 'Defect-free go-lives across 7+ deployments; process improvements increased efficiency by 20%.' },
    ],
  },
  {
    id: 'cs-ai',
    title: 'Evaluating AI output against business rubrics',
    org: 'Mercor',
    role: 'AI Evaluator',
    period: 'May 2026 – present',
    tags: ['Rubrics', 'Prompt testing', 'Quality benchmarks'],
    stages: [
      { n: '01', k: 'Problem', v: 'Model output on business and data tasks needed judging consistently, not impressionistically.' },
      { n: '02', k: 'Discovery', v: '[ADD: how the rubric dimensions were chosen]' },
      { n: '03', k: 'Requirements', v: 'Defined rubrics covering accuracy, reasoning and instruction adherence.' },
      { n: '04', k: 'Analysis', v: 'Tested prompt variations and documented the failure patterns behind weak output.' },
      { n: '05', k: 'Solution', v: 'Tightened quality benchmarks so the next round measured the real gap.' },
      { n: '06', k: 'Delivery', v: 'Ongoing evaluation cycles.' },
      { n: '07', k: 'Validation', v: 'Scores checked against rubric criteria rather than overall impression.' },
      { n: '08', k: 'Impact', v: 'Improved reliability of the evaluated output. [ADD: any shareable measure]' },
    ],
  },
];

/** The 30-second version, for Recruiter Mode. */
export const recruiterProfile = {
  headline: 'Business Analyst — requirements, data validation and regulated delivery',
  years: '4+ years, including 3+ in regulated environments',
  location: 'Toronto, ON — open to onsite or remote',
  core: ['Requirements & functional specs', 'SQL & Power BI', 'Source-to-target validation', 'UAT & defect tracking', 'Backlog & release cycles', 'AI output evaluation'],
  results: [
    'Defect-free go-lives across 7+ deployments (UAT led end to end)',
    '8 Power BI dashboards giving leadership a real-time view',
    'Process improvements that increased efficiency by 20%',
  ],
  topCases: ['cs-platform', 'cs-reporting', 'cs-uat'],
};
