/**
 * SINGLE SOURCE OF TRUTH for all resume content.
 * Every section of the site renders from this object -- edit here, nowhere else.
 *
 * Setting `isPlaceholder` to true shows a visible draft banner.
 */
export const isPlaceholder = false;

export const resume = {
  meta: {
    name: 'Abdulbasit Momin',
    role: 'Business Analyst',
    tagline:
      'I bridge business, data, and technology teams, turning ambiguous business needs into requirements, working software, and delivery you can audit.',
    location: 'Toronto, ON',
    email: 'basitmomin01@gmail.com',
    phone: '+1 (416) 526-8202',
    linkedin: 'https://linkedin.com/in/abmomin1',
    website: 'https://bodywellnessai.com',
    // The live version of this resume. Printed on the PDF, because the paper
    // copy drops the project breakdowns and the evidence explorer and a
    // reader should be able to get to them.
    portfolio: 'abdulbasitmomin.github.io/ai-project',
    github: 'https://github.com/AbdulBasitMomin',
    resumePdf: './assets/Abdulbasit-Momin-Business-Analyst.pdf',
    availability: 'Open to Business Analyst roles in Toronto, ON or remote',
  },

  /**
   * Every figure is quoted verbatim from the source resume, and carries the
   * line it came from. A number a reader cannot trace is a liability.
   */
  stats: [
    { value: 4, suffix: '+', label: 'Years in business analysis', source: 'Since January 2022' },
    { value: 3, suffix: '+', label: 'Years in regulated delivery', source: 'Sarjen Systems, 2022 to 2025' },
    { value: 8, suffix: '', label: 'Power BI dashboards built', source: 'Sarjen Systems' },
    { value: 7, suffix: '+', label: 'Defect-free go-lives', source: 'Sarjen Systems' },
  ],

  about: {
    headline:
      'Business Analyst with 4+ years bridging business, data, and technology teams, including 3+ years in regulated environments where governance, traceability, and audit-readiness are built into every delivery.',
    paragraphs: [
      'I translate business needs into requirements, user stories, acceptance criteria, and functional specs, then validate what actually got delivered through data checks, UAT, and defect tracking. The handoff is where most requirements quietly break, so I stay attached to a change until the data proves it works.',
      'My strengths sit in data mapping, validation, and reporting with SQL, Power BI, and Excel, plus working knowledge of customer data platforms, data privacy, and data quality controls. In regulated delivery I have learned to treat lineage, consent, and sign-off as part of the requirement, not paperwork bolted on afterwards.',
    ],
  },

  experience: [
    {
      role: 'AI Evaluator',
      company: 'Mercor',
      short: 'Mercor',
      location: 'Remote',
      start: 'May 2026',
      end: 'Present',
      summary: '',
      achievements: [
        'Evaluate and score AI model outputs on business and data tasks against defined rubrics, checking accuracy, reasoning, and instruction adherence.',
        'Test prompt variations and document failure patterns to tighten quality benchmarks and improve reliability.',
      ],
      tools: ['Rubric Evaluation', 'Prompt Testing', 'Quality Benchmarks', 'Failure Analysis'],
    },
    {
      role: 'Product Owner / Business Analyst',
      company: 'BodyWellnessAI',
      short: 'BodyWellnessAI',
      location: 'Toronto, ON',
      start: 'July 2025',
      end: 'April 2026',
      summary:
        'End-to-end product ownership: from personas and journey maps through to segmentation logic validated in production.',
      achievements: [
        'Owned requirements and functional specifications for a consumer data platform covering 50+ conditions, including user personas and end-to-end journey maps that drove personalization and segmentation logic.',
        'Translated business needs into user stories, acceptance criteria, process flows, and business rules; managed and prioritized the backlog across multiple release cycles.',
        'Defined and validated audience and segmentation logic using customer, behavioral, and engagement data to support audience creation, testing, and activation to downstream experiences.',
        'Validated outputs with data checks and root-cause analysis, tracking issues to resolution and improving segmentation accuracy and customer engagement over time.',
      ],
      tools: [
        'User Stories',
        'Acceptance Criteria',
        'Journey Maps',
        'Segmentation Logic',
        'Backlog Prioritization',
        'Root-Cause Analysis',
      ],
    },
    {
      role: 'Business Analyst, IT Consulting',
      company: 'Sarjen Systems Pvt. Ltd.',
      short: 'Sarjen',
      location: 'India',
      start: 'January 2022',
      end: 'June 2025',
      summary:
        'Requirements, data validation, and UAT across regulated client deliveries.',
      achievements: [
        'Gathered, analyzed, and prioritized business, functional, data, and technical requirements, facilitating stakeholder discussions to define use cases, KPIs, and success criteria.',
        'Partnered with data architects and engineers to document data sources, schemas, mappings, integration points, APIs, and business rules across regulated deliveries.',
        'Performed source-to-target data validation to ensure accuracy, completeness, and consistency, checking ingestion, transformation logic, and field-level mappings against requirements.',
        'Built 8 Power BI dashboards using SQL and data extracts, giving leadership a real-time view of delivery and performance and supporting reconciliation and business sign-off.',
        'Led UAT end to end (test case development, execution, defect tracking) plus production validation, supporting defect-free go-lives across 7+ deployments.',
        'Documented data governance artifacts (quality controls, privacy, consent, lineage, data flows) in Jira and Confluence; delivered training and process improvements that increased efficiency by 20%.',
      ],
      tools: ['SQL', 'Power BI', 'Jira', 'Confluence', 'UAT', 'Data Mapping', 'Data Governance'],
    },
  ],

  /**
   * NOTE: `level` values are not on the resume -- they are an estimate of
   * relative depth based on how prominently each area features in it.
   * Adjust freely.
   */
  skills: [
    {
      group: 'Requirements & Analysis',
      items: [
        { name: 'Requirements Gathering & Validation', level: 95 },
        { name: 'User Stories & Acceptance Criteria', level: 95 },
        { name: 'Process Flows & Business Rules', level: 90 },
        { name: 'Functional Specifications', level: 90 },
        { name: 'Stakeholder Facilitation', level: 88 },
        { name: 'Use Case & KPI Definition', level: 85 },
      ],
    },
    {
      group: 'Data & Reporting',
      items: [
        { name: 'SQL', level: 88 },
        { name: 'Power BI', level: 88 },
        { name: 'Excel (Advanced)', level: 90 },
        { name: 'Data Mapping & Schema Docs', level: 88 },
        { name: 'Source-to-Target Validation', level: 90 },
        { name: 'Reconciliation & Root-Cause Analysis', level: 88 },
      ],
    },
    {
      group: 'Governance & Data Quality',
      items: [
        { name: 'Data Quality Controls', level: 88 },
        { name: 'Data Privacy, Consent & Compliance', level: 85 },
        { name: 'Data Lineage', level: 82 },
        { name: 'Audience & Segmentation Logic', level: 85 },
        { name: 'Customer Data Platforms (CDP)', level: 78 },
      ],
    },
    {
      group: 'Testing & Delivery',
      items: [
        { name: 'UAT & Test Case Development', level: 92 },
        { name: 'Defect Tracking', level: 90 },
        { name: 'Integration & A/B Testing', level: 80 },
        { name: 'Jira & Confluence', level: 92 },
        { name: 'Measurement Frameworks', level: 82 },
      ],
    },
  ],

  /** Short labels for the draggable 3D sphere. */
  skillCloud: [
    'SQL', 'Power BI', 'Excel', 'Jira', 'Confluence', 'CDP',
    'User Stories', 'Acceptance Criteria', 'Functional Specs', 'Process Flows',
    'Business Rules', 'Data Mapping', 'Source-to-Target', 'Data Lineage',
    'Data Quality', 'Data Privacy', 'Consent', 'Segmentation', 'Personas',
    'Journey Maps', 'KPI Definition', 'UAT', 'Defect Tracking', 'A/B Testing',
    'Reconciliation', 'Root-Cause Analysis', 'Backlog', 'Governance',
  ],

  /**
   * How I work -- the BA lifecycle, rendered as an animated 3D process flow.
   * Each stage is grounded in the verbs the resume actually uses.
   */
  process: [
    {
      stage: 'Elicit',
      blurb: 'Facilitate stakeholder discussions to surface the real need, not the stated one.',
      artifacts: ['Stakeholder interviews', 'Use cases', 'Success criteria'],
    },
    {
      stage: 'Analyse',
      blurb: 'Map the current state, find the gap, and trace the problem to its root cause.',
      artifacts: ['Process flows', 'Gap analysis', 'Root-cause analysis'],
    },
    {
      stage: 'Specify',
      blurb: 'Turn the need into something a team can build and a tester can verify.',
      artifacts: ['User stories', 'Acceptance criteria', 'Functional specs', 'Business rules'],
    },
    {
      stage: 'Validate',
      blurb: 'Prove the delivered thing matches the requirement, with data rather than opinion.',
      artifacts: ['Source-to-target checks', 'UAT', 'Defect tracking'],
    },
    {
      stage: 'Optimise',
      blurb: 'Measure what shipped, then feed the findings back into the next cycle.',
      artifacts: ['KPI frameworks', 'Power BI dashboards', 'Process improvements'],
    },
  ],

  /** Artefacts I actually produce. Straight from the resume. */
  deliverables: [
    'Business & functional requirements',
    'User stories & acceptance criteria',
    'Functional specifications',
    'Process flows & business rules',
    'Requirements traceability',
    'Data mappings & schema docs',
    'Source-to-target validation',
    'UAT plans & test cases',
    'Defect logs & triage',
    'User personas & journey maps',
    'Audience & segmentation logic',
    'KPI & measurement frameworks',
    'Power BI dashboards',
    'Data governance artefacts',
  ],

  /** Where I have done it. */
  domains: [
    {
      name: 'Regulated delivery',
      detail: '3+ years where governance, traceability and audit-readiness are part of the requirement, not paperwork added later.',
    },
    {
      name: 'Consumer data platform',
      detail: 'Requirements and segmentation logic for a platform covering 50+ conditions, from persona through to activation.',
    },
    {
      name: 'IT consulting',
      detail: 'Client-facing analysis across multiple deliveries: requirements, data validation, UAT and go-live support.',
    },
    {
      name: 'AI evaluation',
      detail: 'Scoring model output on business and data tasks against defined rubrics, and documenting failure patterns.',
    },
  ],

  /** Quantified outcomes pulled from the roles above, for quick scanning. */
  projects: [
    {
      name: 'Consumer Data Platform: 50+ Conditions',
      blurb:
        'Owned requirements and functional specs end to end, including user personas and journey maps that drove the personalization and segmentation logic.',
      impact: 'Improved segmentation accuracy and customer engagement over successive releases.',
      tags: ['Requirements', 'Segmentation', 'Journey Maps', 'Backlog'],
      link: 'https://bodywellnessai.com',
    },
    {
      name: 'Leadership Reporting Suite',
      blurb:
        'Built 8 Power BI dashboards on SQL and data extracts, giving leadership a real-time view of delivery and performance.',
      impact: 'Became the basis for reconciliation and business sign-off.',
      tags: ['SQL', 'Power BI', 'Reconciliation'],
      link: '',
    },
    {
      name: 'Regulated UAT & Governance Practice',
      blurb:
        'Led UAT end to end (test case development, execution, defect tracking) plus production validation, and documented the governance artifacts behind it in Jira and Confluence.',
      impact: 'Defect-free go-lives across 7+ deployments; process improvements raised efficiency 20%.',
      tags: ['UAT', 'Defect Tracking', 'Data Governance', 'Confluence'],
      link: '',
    },
  ],

  education: [
    {
      degree: 'B.Eng, Information Technology',
      school: 'Gujarat Technological University',
      location: '',
      start: '2018',
      end: '2022',
      detail: '',
    },
  ],

  certifications: [
    { name: 'Business Analysis & Process Management', issuer: 'Coursera', year: '', link: '' },
    { name: 'AWS for SAP Cloud ERP Essentials', issuer: 'Amazon Web Services', year: '', link: '' },
    { name: 'Agile Project Management', issuer: 'HP LIFE', year: '', link: '' },
    { name: 'AI Fluency: Framework and Foundations', issuer: 'Anthropic Academy', year: '', link: '' },
    // Not yet held, so it carries a status and never renders as a completed
    // credential. A certification claimed early is the fastest way to lose a
    // recruiter's trust.
    { name: 'PMP', issuer: 'Project Management Institute', year: '', link: '', status: 'In progress' },
  ],

  awards: [{ name: 'Employee of the Month', issuer: 'Sarjen Systems', year: '' }],

  testimonials: [],
};
