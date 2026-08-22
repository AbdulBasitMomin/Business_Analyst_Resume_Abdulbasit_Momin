/**
 * Journey content: the chapters the visitor travels through.
 *
 * GROUNDING RULE, applied throughout this file: every claim traces to a line
 * in the source resume. Where the concept needs detail the resume does not
 * supply, the text carries an explicit `[ADD ...]` placeholder rather than a
 * plausible invention. Anything a reader could mistake for a credential --
 * a tool, a metric, a responsibility -- is either sourced or marked.
 *
 * Illustrative material (the user-story lab, the sprint board) is labelled as
 * illustrative in its own copy, so it reads as "how I work", never as "this
 * happened".
 */

/**
 * The twelve stations of the scroll journey. `key` matches a station in
 * chapters.js; `anchor` is the DOM section the camera is tied to.
 */
export const chapters = [
  { key: 'problem', num: '01', title: 'The problem', anchor: 'ch-problem',
    lede: 'Fragmented inputs, no shared definition of what is actually wrong.' },
  { key: 'discovery', num: '02', title: 'Discovery', anchor: 'ch-problem',
    lede: 'Before solving a problem, understand it.' },
  { key: 'stakeholders', num: '03', title: 'Stakeholders', anchor: 'ch-stakeholders',
    lede: 'Every requirement has an owner, a source, and a decision behind it.' },
  { key: 'requirements', num: '04', title: 'Requirements', anchor: 'ch-requirements',
    lede: 'Ambiguity in. Structure out.' },
  { key: 'stories', num: '05', title: 'User story lab', anchor: 'ch-stories',
    lede: 'Epic to story to acceptance criteria to task.' },
  { key: 'agile', num: '06', title: 'Delivery', anchor: 'ch-agile',
    lede: 'A backlog is a sequence of decisions, not a list.' },
  { key: 'data', num: '07', title: 'Data', anchor: 'ch-data',
    lede: 'Source to target, and proof that nothing was lost on the way.' },
  { key: 'ai', num: '08', title: 'AI', anchor: 'ch-ai',
    lede: 'AI accelerates analysis. Human judgement owns the decision.' },
  { key: 'uat', num: '09', title: 'Validation', anchor: 'ch-uat',
    lede: 'A requirement is not done until something proves it.' },
  { key: 'impact', num: '10', title: 'Impact', anchor: 'ch-impact',
    lede: 'What measurably changed.' },
];

/** Chapter 01 -- the scattered inputs that converge into a problem statement. */
export const problemInputs = [
  'Stakeholder requests', 'Support tickets', 'Conflicting reports',
  'Spreadsheet exports', 'Process documents', 'Customer feedback',
  'KPI dashboards', 'Email threads',
];

export const discoveryMethods = [
  { name: 'Stakeholder discovery', note: 'Facilitated discussions to define use cases, KPIs and success criteria.' },
  { name: 'Current-state analysis', note: 'Map how the process and data actually behave today.' },
  { name: 'Root-cause analysis', note: 'Trace a reported symptom to the mechanism producing it.' },
  { name: 'Gap analysis', note: 'Separate what exists from what the requirement needs.' },
];

/**
 * Chapter 02 -- stakeholder ecosystem. `needs` / `provides` / `decides` are
 * generic to the BA role rather than claims about a specific employer.
 */
export const stakeholders = [
  { id: 'business', name: 'Business', needs: 'A solution framed in outcomes, not features.',
    provides: 'Objectives, constraints, priority.', decides: 'Whether the problem is worth solving now.' },
  { id: 'product', name: 'Product', needs: 'Scope that fits a release.',
    provides: 'Roadmap context, trade-off calls.', decides: 'What ships and in what order.' },
  { id: 'engineering', name: 'Engineering', needs: 'Requirements precise enough to build from.',
    provides: 'Feasibility, effort, technical constraints.', decides: 'How it gets built.' },
  { id: 'data', name: 'Data', needs: 'Clear definitions and lineage.',
    provides: 'Sources, schemas, mappings, integration points.', decides: 'Whether the data can support the ask.' },
  { id: 'qa', name: 'QA', needs: 'Acceptance criteria that can be tested.',
    provides: 'Defects, coverage gaps, regression risk.', decides: 'Whether it behaves as specified.' },
  { id: 'operations', name: 'Operations', needs: 'A process people can actually run.',
    provides: 'Day-to-day reality, workarounds, exceptions.', decides: 'Whether it survives contact with the floor.' },
  { id: 'compliance', name: 'Compliance', needs: 'Traceability and evidence.',
    provides: 'Privacy, consent and retention rules.', decides: 'Whether it is allowed to ship.' },
  { id: 'leadership', name: 'Leadership', needs: 'A single, reconciled view.',
    provides: 'Funding, mandate, escalation.', decides: 'Whether to sign off.' },
];

export const elicitation = ['Interviews', 'Workshops', 'Requirement sessions', 'Stakeholder alignment'];

/** Chapter 03 -- requirement artefact types, all named in the resume. */
export const requirementTypes = [
  { name: 'Business requirements', note: 'Why the change is worth making.' },
  { name: 'Functional requirements', note: 'What the system must do.' },
  { name: 'Functional specifications', note: 'How the behaviour is defined in detail.' },
  { name: 'User stories', note: 'The need from the user’s side.' },
  { name: 'Acceptance criteria', note: 'The conditions that settle "done".' },
  { name: 'Business rules', note: 'The logic that must hold regardless of screen.' },
  { name: 'Use cases', note: 'The paths through the behaviour, including the unhappy ones.' },
  { name: 'Process flows', note: 'Where the work goes and who touches it.' },
];

export const clarityLadder = ['Ambiguity', 'Analysis', 'Clarity', 'Requirement'];

/**
 * Chapter 04 -- the user story lab.
 * ILLUSTRATIVE. A worked example of the structure, not a delivered ticket.
 */
export const storyLab = {
  illustrative: true,
  epic: 'Application status transparency',
  story: 'As a customer, I want to track my application status so that I know what action is required of me.',
  criteria: [
    { given: 'an application in progress', when: 'the customer opens the status view', then: 'the current stage and the next required action are both shown' },
    { given: 'an application awaiting customer input', when: 'the status view loads', then: 'the outstanding item is named explicitly, not implied' },
    { given: 'no application on record', when: 'the customer opens the status view', then: 'an empty state explains how to start one' },
  ],
  meta: [
    { label: 'Priority', value: 'High — blocks the top support-contact reason' },
    { label: 'Business value', value: 'Fewer status-chasing contacts; less manual handling' },
    { label: 'Dependencies', value: 'Status source of truth; notification service' },
    { label: 'Assumptions', value: 'Stage names are stable and customer-facing' },
  ],
  edgeCases: [
    'Status changes while the view is open',
    'Application withdrawn mid-process',
    'Multiple concurrent applications',
    'Stage exists internally but has no customer-safe label',
  ],
  tasks: ['Define status taxonomy', 'Map source fields to display stages', 'Specify empty and error states', 'Write UAT scenarios'],
};

/**
 * Chapter 05 -- delivery board.
 * ILLUSTRATIVE MECHANICS. The columns and ceremonies are how the work runs;
 * the cards are sample items so the visitor can drive the board themselves.
 * No sprint metrics are asserted -- the burndown responds to the visitor's own
 * clicks, so it never implies a historical record.
 */
export const board = {
  illustrative: true,
  columns: ['Backlog', 'Sprint', 'In progress', 'Review', 'UAT', 'Done'],
  cards: [
    { id: 'C1', title: 'Status taxonomy definition', points: 3, type: 'Analysis' },
    { id: 'C2', title: 'Source-to-target field mapping', points: 5, type: 'Data' },
    { id: 'C3', title: 'Acceptance criteria: empty states', points: 2, type: 'Spec' },
    { id: 'C4', title: 'Segmentation rule review', points: 3, type: 'Analysis' },
    { id: 'C5', title: 'UAT scenarios: status view', points: 5, type: 'Test' },
    { id: 'C6', title: 'Consent flag reconciliation', points: 8, type: 'Data' },
    { id: 'C7', title: 'Defect triage: stage mismatch', points: 2, type: 'Defect' },
  ],
  ceremonies: [
    { name: 'Backlog refinement', note: 'Prioritise, size, and strip ambiguity before anything enters a sprint.' },
    { name: 'Sprint planning', note: 'Agree a goal and the capacity it has to fit inside.' },
    { name: 'Sprint review', note: 'Show the increment to the people who asked for it.' },
    { name: 'Retrospective', note: 'What worked, what did not, what changes next sprint.' },
  ],
  retro: [
    { heading: 'What went well', items: ['Acceptance criteria written before build started', 'Data questions raised in refinement, not UAT'] },
    { heading: 'What did not', items: ['Late consent-rule clarification forced rework', 'Two cards carried over'] },
    { heading: 'What changes next', items: ['Compliance joins refinement for data-touching stories', 'Cap work in progress at four'] },
  ],
};

/** Chapter 06 -- data pipeline. Every stage names something in the resume. */
export const pipeline = [
  { stage: 'Source systems', note: 'Document sources, schemas, integration points and APIs.' },
  { stage: 'Ingestion', note: 'Check what actually arrived against what was specified.' },
  { stage: 'Mapping', note: 'Field-level source-to-target mappings, written down.' },
  { stage: 'Transformation', note: 'Validate the logic, not just the output row count.' },
  { stage: 'Data model', note: 'Definitions that survive being reported on.' },
  { stage: 'SQL', note: 'Query the model directly to test the requirement.' },
  { stage: 'Power BI', note: 'Dashboards leadership can act on — 8 built at Sarjen Systems.' },
  { stage: 'Business insight', note: 'Reconciliation and business sign-off.' },
];

export const dataControls = [
  'Source-to-target validation', 'Data quality controls', 'Reconciliation',
  'Root-cause analysis', 'Data lineage', 'Privacy, consent & compliance',
];

/**
 * Chapter 07 -- AI.
 * Scoped hard to what the resume supports: the Mercor evaluator role and the
 * Anthropic AI Fluency certification. Capabilities the resume does not
 * evidence (model building, automation engineering, agent development) are
 * deliberately absent.
 */
export const ai = {
  stance: 'AI accelerates analysis. Human judgement owns the decision.',
  grounding: 'Evidenced by the AI Evaluator role at Mercor and the AI Fluency certification (Anthropic Academy).',
  loop: [
    { step: 'Input', note: 'Business and data tasks, with a defined rubric for what good looks like.' },
    { step: 'Model output', note: 'Candidate answers to score, not to trust.' },
    { step: 'Evaluation', note: 'Score against accuracy, reasoning and instruction adherence.' },
    { step: 'Failure patterns', note: 'Document where and how output breaks, not just that it did.' },
    { step: 'Benchmark change', note: 'Tighten the rubric so the next round measures the real gap.' },
    { step: 'Human decision', note: 'A person owns the call. The model informs it.' },
  ],
  practices: [
    { name: 'Rubric design & scoring', note: 'Turn "is this good?" into criteria two people would grade the same way.' },
    { name: 'Prompt-variation testing', note: 'Change one thing at a time and record what moved.' },
    { name: 'Failure-pattern documentation', note: 'A catalogue of how it fails is worth more than a pass rate.' },
    { name: 'Instruction-adherence review', note: 'Did it answer the question asked, or a nearby easier one?' },
  ],
  // Kept explicitly separate from the practices above: this is the analogy,
  // not a claim of delivered work.
  transfer: 'The same discipline a BA already applies to requirements — define the criteria, test one variable, write down how it failed — is what makes model output reviewable.',
};

/** Chapter 08 -- validation chain. All steps named in the resume. */
export const uatChain = [
  { step: 'Requirement', note: 'The statement being proved.' },
  { step: 'Test scenario', note: 'The situation that would expose it.' },
  { step: 'Test case', note: 'Concrete steps and expected result.' },
  { step: 'Execution', note: 'Run it, record what happened.' },
  { step: 'Defect', note: 'Log, triage, route, track to resolution.' },
  { step: 'Retest', note: 'Prove the fix, and that nothing near it broke.' },
  { step: 'Production validation', note: 'Confirm behaviour in the live environment.' },
  { step: 'Sign-off', note: 'Business accepts, with evidence attached.' },
];

/**
 * Chapter 09 -- impact. ONLY figures that appear in the source resume.
 * No derived, rounded or estimated numbers.
 */
export const impact = [
  { value: '20%', label: 'Efficiency gain', note: 'From training and process improvements at Sarjen Systems.', direction: 'up' },
  { value: '8', label: 'Power BI dashboards', note: 'Built on SQL and data extracts for leadership visibility.', direction: 'up' },
  { value: '7+', label: 'Defect-free go-lives', note: 'Across deployments where I led UAT end to end.', direction: 'up' },
  { value: '50+', label: 'Conditions covered', note: 'Scope of the consumer data platform I owned requirements for.', direction: 'up' },
  { value: '4+', label: 'Years as a BA', note: 'Across IT consulting, product ownership and AI evaluation.', direction: 'up' },
  { value: '3+', label: 'Years regulated', note: 'Where governance and audit-readiness were part of the requirement.', direction: 'up' },
];

export const convergence = ['People', 'Process', 'Data', 'AI', 'Technology'];

/**
 * What measurably changed. Each line is quoted or directly paraphrased from a
 * resume achievement bullet and names the employer it happened at, so every
 * claim here is one a candidate can talk through in an interview.
 */
export const outcomes = [
  { metric: '7+', unit: 'deployments',
    what: 'Defect-free go-lives, with UAT led end to end — test case development, execution, defect tracking, plus production validation.',
    org: 'Sarjen Systems' },
  { metric: '20%', unit: 'efficiency gain',
    what: 'Training delivered and process improvements made alongside the governance artefacts they documented.',
    org: 'Sarjen Systems' },
  { metric: '8', unit: 'dashboards',
    what: 'Power BI on SQL and data extracts, giving leadership a real-time view of delivery and performance — and the basis for reconciliation and business sign-off.',
    org: 'Sarjen Systems' },
  { metric: '50+', unit: 'conditions',
    what: 'Requirements and functional specifications owned for a consumer data platform at that scope, personas and journey maps included.',
    org: 'BodyWellnessAI' },
  { metric: '↑', unit: 'segmentation accuracy',
    what: 'Improved over successive releases, along with customer engagement, by validating outputs with data checks and root-cause analysis.',
    org: 'BodyWellnessAI' },
  { metric: '↑', unit: 'output reliability',
    what: 'Quality benchmarks tightened by testing prompt variations and documenting the failure patterns behind weak output.',
    org: 'Mercor' },
];
