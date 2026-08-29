import { useState } from 'react';
import { Download, Menu, X } from 'lucide-react';
import Backdrop from './Backdrop';
import { resume } from '@resume';

// The live resume this page fronts. Absolute rather than relative, because the
// built page gets installed at more than one path and a relative link would
// only resolve at one of them.
const RESUME = `https://${resume.meta.portfolio}/`;

const NAV_LINKS: [string, string][] = [
  ['ABOUT', 'summary'],
  ['EXPERIENCE', 'experience'],
  ['PROJECTS', 'projects'],
  ['SKILLS', 'skills'],
  ['METHOD', 'method'],
  ['TALK', 'contact'],
];

// Grouped from the resume's own skills and deliverables. Nothing here is a
// service that has not already been performed in one of the three roles.
// Kept short deliberately. The reference's list is one or two words per line;
// longer labels wrap at the 2-column mobile width and push the composition off
// the bottom of a locked viewport.
const CAPABILITIES = [
  'Requirements Analysis',
  'User Stories & Criteria',
  'Data Mapping & Validation',
  'SQL & Power BI',
  'UAT & Defect Tracking',
  'Data Governance',
];

// The reference put three award chips here. There are no design awards to put
// in them, so they carry the resume's three quantified figures instead, each
// one hover-titled with the line it came from -- same slot, nothing invented.
// Short forms, because the reference's chips hold "x1" and "x7" and a full
// sentence here wraps the row onto three lines on a phone. The full label and
// the resume line each figure came from are on the chip's title.
const FIGURES = [
  { stat: resume.stats[0], short: 'years' },
  { stat: resume.stats[2], short: 'dashboards' },
  { stat: resume.stats[3], short: 'go-lives' },
];

const CERTS_HELD = resume.certifications.filter((c) => !c.status).length;

const PDF = `${RESUME}${resume.meta.resumePdf.replace(/^\.\//, '')}`;
const TEL = `tel:${resume.meta.phone.replace(/[^\d+]/g, '')}`;

const [FIRST, LAST] = resume.meta.name.toUpperCase().split(' ');
const [ROLE_1, ROLE_2] = resume.meta.role.toUpperCase().split(' ');

// The two headline words that break out of Inter into the bitmap face. 1.25em
// keeps them optically level with the Inter caps around them, which sit on a
// larger body relative to their cap height.
// 1.05em, not the reference's 1.25em: Silkscreen sets wider than the basis33
// it stands in for, and at 1.25em DELIVERABLES ran past the column edge.
const PIXEL_WORD = 'font-display font-normal text-[1.05em] inline-block leading-none align-baseline';

const META_LABEL = 'text-base tracking-widest text-white/50 uppercase mb-3 font-display';

// Initials rather than a brand mark. There is no logo to use and inventing one
// would be inventing a brand that does not exist.
function Monogram() {
  return (
    <span className="font-display text-2xl leading-none tracking-tight select-none" aria-label={resume.meta.name}>
      AM
    </span>
  );
}

export default function Me() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black text-white">
      {/* The reference's background is a stock video of a model on someone
          else's CDN -- not licensed here, unrelated to the work, and dead the
          day that URL moves. This is a generated scene of the instruments the
          role actually uses instead. */}
      <Backdrop />

      <div className="relative z-10 flex h-full flex-col px-5 sm:px-6 md:px-10 lg:px-14">
        <nav className="flex items-center justify-between py-6">
          <a href={RESUME} className="hover:opacity-70 transition-opacity">
            <Monogram />
          </a>

          <div className="hidden md:flex items-center gap-8 text-sm tracking-wide">
            {NAV_LINKS.map(([label, id]) => (
              <a key={label} href={`${RESUME}#${id}`} className="hover:opacity-70 transition-opacity">
                {label}
              </a>
            ))}
          </div>

          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
            className="md:hidden p-2 hover:opacity-70"
          >
            <Menu size={24} />
          </button>
        </nav>

        <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          <div>
            <h2 className="text-lg md:text-xl tracking-wide leading-tight">
              <span className="block font-normal">{FIRST}</span>
              <span className="block font-display text-2xl md:text-3xl">{LAST}</span>
            </h2>
            <div className="text-[10px] text-white/50 mt-3">*</div>
            <p className="font-display mt-1 text-xs text-white/60 leading-relaxed">
              Based in {resume.meta.location},
              <br />
              open to BA roles onsite
              <br />
              or remote. Every figure
              <br />
              here is sourced
            </p>
          </div>

          <div className="text-right lg:text-left">
            <h2 className="text-lg md:text-xl tracking-wide leading-tight">
              <span className="block font-normal">{ROLE_1}</span>
              <span className="block font-display text-2xl md:text-3xl">{ROLE_2}</span>
            </h2>
          </div>

          <div>
            <div className={META_LABEL}>What I Do</div>
            <p className="text-sm text-white/90 leading-relaxed max-w-[220px]">
              I turn ambiguous business needs into requirements and auditable delivery
            </p>
          </div>

          <div className="text-right lg:text-left">
            <div className={META_LABEL}>Capabilities</div>
            <ul className="text-sm text-white/90 leading-relaxed space-y-0.5">
              {CAPABILITIES.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex-1" />

        <div className="pb-4">
          {/* Not an even split. The right column holds a button and three small
              chips; the headline needs the room far more, and at an even split
              REQUIREMENTS & overran the column on its own between lg and xl. */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.45fr_1fr] gap-4 sm:gap-6 items-end">
            {/* 0.72 leading is tighter than any Tailwind step and is the whole
                look of the headline -- the lines interlock rather than stack. */}
            <h1
              className="text-3xl sm:text-4xl md:text-5xl lg:text-[3rem] xl:text-[3.75rem] 2xl:text-[4.25rem] tracking-wide uppercase font-normal"
              style={{ lineHeight: 0.72 }}
            >
              I TURN THE
              <br />
              <span className={PIXEL_WORD}>AMBIGUOUS</span> INTO
              <br />
              REQUIREMENTS &amp;
              <br />
              <span className={PIXEL_WORD}>DELIVERABLES</span>
            </h1>

            <div className="flex flex-col gap-4 sm:gap-6 justify-end">
              {/* The reference's showreel button. There is no showreel; the
                  equivalent call to action is the resume itself. */}
              <a
                href={PDF}
                download
                className="self-start flex items-center gap-3 border border-white/30 px-6 py-3 backdrop-blur-sm bg-white/5 hover:bg-white/10 transition-colors"
              >
                <Download size={14} />
                <span className="text-sm tracking-wider">DOWNLOAD RESUME</span>
              </a>

              <div className="self-start lg:self-end flex flex-wrap items-stretch gap-2 sm:gap-3 text-sm text-white/80">
                {FIGURES.map(({ stat, short }) => (
                  <div
                    key={stat.label}
                    title={`${stat.label} -- ${stat.source}`}
                    className="bg-[#0B0B0B] px-3 sm:px-4 py-2 flex items-center gap-2"
                  >
                    <span className="font-bold text-lg sm:text-xl">
                      {stat.value}
                      {stat.suffix}
                    </span>
                    <span className="text-white/50 text-xs">{short}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 sm:mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 pt-4">
            <div className="text-xs text-white/60">
              {resume.meta.availability}.{' '}
              <a href={TEL} className="text-red-500 hover:text-red-400 transition-colors">
                Schedule a call
              </a>
            </div>
            <div className="text-xs text-white/60 sm:text-right">
              {resume.experience.length} roles &bull; {resume.deliverables.length} deliverable types &bull;{' '}
              {CERTS_HELD} certifications
            </div>
          </div>
        </div>
      </div>

      <div
        className={`fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-6">
          <Monogram />
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="p-2 hover:opacity-70"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex flex-col items-center justify-center flex-1 gap-8">
          {NAV_LINKS.map(([label, id], i) => (
            <a
              key={label}
              href={`${RESUME}#${id}`}
              onClick={() => setMenuOpen(false)}
              // Staggered only on the way in. Closing runs every link at once,
              // otherwise the overlay fades out from under a still-animating list.
              style={{ transitionDelay: menuOpen ? `${100 + i * 60}ms` : '0ms' }}
              className={`text-2xl tracking-widest transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                menuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              {label}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
}
