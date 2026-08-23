/**
 * "Ask my portfolio" -- a retrieval assistant over verified portfolio content.
 *
 * DELIBERATELY NOT AN LLM. A static site cannot call a model without shipping
 * an API key to the browser, and the brief's own constraint is that answers
 * must come only from portfolio content and never invent qualifications. So
 * this scores the question against intents built from the data files and
 * returns the matching content with its source attached. Every answer is
 * traceable to a line in the resume; an unmatched question says so rather than
 * guessing.
 *
 * The UI labels it accurately: "searches verified portfolio content".
 */
import { capabilities, caseStudies, recruiterProfile, projectsFor } from './evidence.js';
import { ai, impact, uatChain, pipeline } from './journey.js';
import { resume } from './data.js';

const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9\s+]/g, ' ');
// Two characters minimum, not three: dropping short tokens threw away the
// most important terms in the domain -- "AI", "BI", "QA".
const tokens = (s) => norm(s).split(/\s+/).filter((w) => w.length >= 2);

/**
 * Answers are {title, lines[], proof[], sources[]}.
 *
 * `proof` is the important half: every row is skill -> project -> the resume
 * line behind it, so a recruiter can verify a claim rather than take it. Rows
 * are built from the evidence map, so the assistant cannot state anything the
 * resume does not.
 */
function proofRows(caps) {
  return caps.map((c) => {
    const ev = c.evidence[0];
    return {
      skill: c.name,
      project: projectsFor(c).map((p) => p.title).join('; ') || (ev ? ev.company : '·'),
      evidence: ev ? ev.quote : 'Listed in the resume skills section, with no supporting achievement bullet.',
      weak: !ev,
    };
  });
}

function capabilityAnswer(cat, title) {
  const caps = capabilities.filter((c) => c.cat === cat);
  return {
    title,
    lines: [],
    proof: proofRows(caps),
    sources: [...new Set(caps.flatMap((c) => c.evidence.map((e) => e.company)))],
  };
}

/** Answer for a named skill area, assembled from matching capabilities. */
function areaAnswer(title, matcher, extra = []) {
  const caps = capabilities.filter(matcher);
  return {
    title,
    lines: extra,
    proof: proofRows(caps),
    sources: [...new Set(caps.flatMap((c) => c.evidence.map((e) => e.company)))],
  };
}

const INTENTS = [
  {
    id: 'strengths',
    keys: 'strongest best strengths core top skills good at specialise specialty',
    build: () => ({
      title: 'Strongest areas',
      lines: [
        ...recruiterProfile.core.map((c) => c),
        '',
        'Backed by: ' + recruiterProfile.results.join(' · '),
      ],
      sources: ['Professional summary', 'Sarjen Systems', 'BodyWellnessAI'],
    }),
  },
  {
    id: 'agile',
    keys: 'agile scrum sprint backlog kanban ceremony retrospective release delivery iteration',
    build: () => areaAnswer('Agile and delivery', (c) => c.cat === 'Delivery'),
  },
  {
    id: 'ai',
    keys: 'ai artificial intelligence llm model prompt genai generative machine learning evaluation rubric',
    build: () => areaAnswer('AI in the work', (c) => c.cat === 'AI', [ai.stance, ai.grounding]),
  },
  {
    id: 'data',
    keys: 'data sql power bi dashboard reporting pipeline etl model warehouse query excel analytics',
    build: () => areaAnswer('Data work', (c) => c.cat === 'Data',
      ['Source to insight: ' + pipeline.map((p) => p.stage).join(' → ')]),
  },
  {
    id: 'uat',
    keys: 'uat test testing qa defect bug validation sign off signoff regression acceptance quality',
    build: () => areaAnswer('UAT and validation',
      (c) => /UAT|Test cases|Root-cause|Source-to-target/.test(c.name),
      ['Chain applied: ' + uatChain.map((u) => u.step).join(' → ')]),
  },
  {
    id: 'requirements',
    keys: 'requirement requirements brd frd story stories acceptance criteria specification spec elicitation business rules',
    build: () => capabilityAnswer('Business analysis', 'Requirements and analysis'),
  },
  {
    id: 'stakeholders',
    keys: 'stakeholder stakeholders communication workshop interview facilitation alignment people',
    build: () => ({
      title: 'Stakeholder management',
      lines: [
        'Sarjen Systems: “Gathered, analyzed, and prioritized business, functional, data, and technical requirements, facilitating stakeholder discussions to define use cases, KPIs, and success criteria.”',
        'Sarjen Systems: “Partnered with data architects and engineers to document data sources, schemas, mappings, integration points, APIs, and business rules.”',
      ],
      sources: ['Sarjen Systems'],
    }),
  },
  {
    id: 'projects',
    keys: 'project projects case study studies portfolio work example examples built',
    build: () => ({
      title: 'Case studies',
      lines: caseStudies.map((c) => `${c.title} · ${c.org}, ${c.period}`),
      sources: caseStudies.map((c) => c.org),
    }),
  },
  {
    id: 'impact',
    keys: 'impact result results metric metrics outcome achievement achievements numbers roi efficiency',
    build: () => ({
      title: 'Measured outcomes',
      lines: impact.map((i) => `${i.value} · ${i.label}: ${i.note}`),
      sources: ['Sarjen Systems', 'BodyWellnessAI'],
    }),
  },
  {
    id: 'regulated',
    keys: 'regulated compliance governance audit privacy consent lineage gdpr risk control',
    build: () => ({
      title: 'Regulated delivery and governance',
      lines: [
        '3+ of 4+ years were in regulated environments where governance, traceability and audit-readiness were built into delivery.',
        'Sarjen Systems: “Documented data governance artifacts (quality controls, privacy, consent, lineage, data flows) in Jira and Confluence.”',
      ],
      sources: ['Professional summary', 'Sarjen Systems'],
    }),
  },
  {
    id: 'experience',
    keys: 'experience years roles role history career worked employer company companies background',
    build: () => ({
      title: 'Roles',
      lines: resume.experience.map((r) => `${r.role} · ${r.company}, ${r.start} to ${r.end}`),
      sources: resume.experience.map((r) => r.company),
    }),
  },
  {
    id: 'education',
    keys: 'education degree university certification certifications certified course qualification study',
    build: () => ({
      title: 'Education and certifications',
      lines: [
        ...resume.education.map((e) => `${e.degree} · ${e.school}, ${e.start} to ${e.end}`),
        ...resume.certifications.map((c) => `${c.name}${c.status ? ` (${c.status})` : ''} · ${c.issuer}`),
        ...(resume.awards || []).map((a) => `Award: ${a.name} · ${a.issuer}`),
      ],
      sources: ['Resume'],
    }),
  },
  {
    id: 'different',
    keys: 'different differentiate unique why hire special stand out apart candidate better',
    build: () => ({
      title: 'What is different here',
      lines: [
        'Requirements and validation in the same pair of hands: the person who wrote the spec also ran the UAT that proved it. “Led UAT end to end … supporting defect-free go-lives across 7+ deployments.”',
        'Regulated delivery as a default, not an exception: 3+ years where traceability and audit-readiness were part of the requirement.',
        'Data literacy at the field level: “Checking ingestion, transformation logic, and field-level mappings against requirements.”',
        'Evaluating AI output against explicit rubrics, which is the same discipline as writing testable acceptance criteria.',
      ],
      sources: ['Sarjen Systems', 'BodyWellnessAI', 'Mercor'],
    }),
  },
  {
    id: 'contact',
    keys: 'contact email hire reach available availability location toronto resume download linkedin',
    build: () => ({
      title: 'Getting in touch',
      lines: [
        `${resume.meta.email}`,
        `${resume.meta.phone}`,
        `${resume.meta.location}. ${resume.meta.availability}`,
        `LinkedIn: ${resume.meta.linkedin}`,
      ],
      sources: ['Resume'],
    }),
  },
];

export const SUGGESTED = [
  'What are your strongest BA skills?',
  'Show me your Agile experience.',
  'How have you used AI?',
  'Show me a data project.',
  'Tell me about your UAT experience.',
  'What makes you different from other candidates?',
];

/** Scores the question against every intent's keyword set; best match wins. */
export function answer(question) {
  const qs = tokens(question);
  if (!qs.length) return null;

  let best = null;
  let bestScore = 0;
  for (const intent of INTENTS) {
    const keys = new Set(intent.keys.split(/\s+/));
    let score = 0;
    for (const w of qs) {
      if (keys.has(w)) score += 2;
      else for (const k of keys) if (k.length > 4 && (w.startsWith(k) || k.startsWith(w))) { score += 1; break; }
    }
    if (score > bestScore) { bestScore = score; best = intent; }
  }

  // Below threshold we say so, rather than returning the least-bad guess.
  if (!best || bestScore < 2) {
    return {
      title: 'Not covered here',
      lines: [
        'That is not something the portfolio content answers, and this assistant will not guess at it.',
        'Try one of the suggested questions, or ask about requirements, data, AI, Agile, UAT, governance, projects, impact or contact details.',
      ],
      sources: [],
      unmatched: true,
    };
  }
  return best.build();
}
