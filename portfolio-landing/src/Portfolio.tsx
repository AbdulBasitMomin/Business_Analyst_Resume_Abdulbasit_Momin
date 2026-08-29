import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Backdrop from './Backdrop';
import { Cover, DeliverableMark } from './portfolioCovers';
import {
  DELIVERABLES, DELIVERABLE_COUNT, EYEBROW, FOCUS_AREAS, LOADING_WORDS, MAILTO,
  MARQUEE, METHOD, NAV, PDF, PROJECTS, ROLE_COUNT, SOCIALS, STATS, meta,
} from './portfolioContent';

gsap.registerPlugin(ScrollTrigger);

const EASE = [0.25, 0.1, 0.25, 1] as const;
const RISE = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 1, ease: EASE },
  viewport: { once: true, margin: '-100px' },
};

const still = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------------------------------------------ loading */

function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [count, setCount] = useState(0);
  const [word, setWord] = useState(0);

  useEffect(() => {
    // A reader who has asked for less motion should not be held at a splash
    // screen while a counter animates.
    if (still()) {
      setCount(100);
      const t = setTimeout(onComplete, 150);
      return () => clearTimeout(t);
    }
    const DURATION = 2700;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min((now - start) / DURATION, 1);
      setCount(Math.round(p * 100));
      if (p < 1) raf = requestAnimationFrame(tick);
      else setTimeout(onComplete, 400);
    };
    raf = requestAnimationFrame(tick);
    const spin = setInterval(() => setWord((w) => (w + 1) % LOADING_WORDS.length), 900);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(spin);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[9999] bg-bg" role="status" aria-label="Loading">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute left-6 top-6 text-xs uppercase tracking-[0.3em] text-muted md:left-10 md:top-10"
      >
        Portfolio
      </motion.div>

      <div className="flex h-full items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.span
            key={word}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35 }}
            className="font-display text-4xl italic text-text-primary/80 md:text-6xl lg:text-7xl"
          >
            {LOADING_WORDS[word]}
          </motion.span>
        </AnimatePresence>
      </div>

      <div className="absolute bottom-10 right-6 font-display text-6xl tabular-nums text-text-primary md:right-10 md:text-8xl lg:text-9xl">
        {String(count).padStart(3, '0')}
      </div>

      <div className="absolute bottom-0 left-0 h-[3px] w-full bg-stroke/50">
        <div
          className="accent-gradient h-full origin-left"
          style={{ transform: `scaleX(${count / 100})`, boxShadow: '0 0 8px rgba(137,170,204,0.35)' }}
        />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- chrome */

/** The gradient ring the reference shows on hover, as one reusable layer. */
function Ring({ show }: { show: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`ring-gradient pointer-events-none absolute rounded-full transition-opacity duration-300 animate-gradient-shift ${
        show ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ inset: -2 }}
    />
  );
}

function Navbar() {
  const [stuck, setStuck] = useState(false);
  const [hot, setHot] = useState(false);

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 100);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="fixed left-0 right-0 top-0 z-50 flex justify-center px-4 pt-4 md:pt-6">
      <nav
        className={`inline-flex items-center rounded-full border border-white/10 bg-surface px-2 py-2 backdrop-blur-md transition-shadow ${
          stuck ? 'shadow-md shadow-black/40' : ''
        }`}
      >
        <a href="#top" className="group relative mr-1 grid h-9 w-9 place-items-center" aria-label={meta.name}>
          <span className="accent-gradient absolute inset-0 rounded-full transition-transform duration-300 group-hover:scale-110" />
          <span className="absolute inset-[2px] rounded-full bg-bg" />
          <span className="relative font-display text-[13px] italic text-text-primary">AM</span>
        </a>

        <span className="mx-1 hidden h-5 w-px bg-stroke sm:block" />

        {NAV.map((n) => (
          <a
            key={n.label}
            href={n.href}
            className="rounded-full px-3 py-1.5 text-xs text-muted transition-colors hover:bg-stroke/50 hover:text-text-primary sm:px-4 sm:py-2 sm:text-sm"
          >
            {n.label}
          </a>
        ))}

        <span className="mx-1 hidden h-5 w-px bg-stroke sm:block" />

        <a
          href={MAILTO}
          onMouseEnter={() => setHot(true)}
          onMouseLeave={() => setHot(false)}
          className="relative rounded-full text-xs sm:text-sm"
        >
          <Ring show={hot} />
          <span className="relative block rounded-full bg-surface px-3 py-1.5 text-text-primary backdrop-blur-md sm:px-4 sm:py-2">
            Say hi ↗
          </span>
        </a>
      </nav>
    </header>
  );
}

/* ---------------------------------------------------------------------- hero */

function Hero() {
  const root = useRef<HTMLElement>(null);
  const [area, setArea] = useState(0);

  useEffect(() => {
    if (still()) return;
    const t = setInterval(() => setArea((a) => (a + 1) % FOCUS_AREAS.length), 2600);
    return () => clearInterval(t);
  }, []);

  useLayoutEffect(() => {
    if (still()) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.from('.name-reveal', { opacity: 0, y: 50, duration: 1.2, delay: 0.1 });
      tl.from('.blur-in', { opacity: 0, filter: 'blur(10px)', y: 20, duration: 1, stagger: 0.1 }, 0.3);
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} id="top" className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <Backdrop layout="center" dim />

      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
        <p className="blur-in mb-8 text-xs uppercase tracking-[0.3em] text-muted">{EYEBROW}</p>

        <h1 className="name-reveal mb-6 font-display text-6xl italic leading-[0.9] tracking-tight text-text-primary md:text-8xl lg:text-9xl">
          {meta.name}
        </h1>

        <p className="blur-in mb-6 text-base text-muted md:text-lg">
          Working across{' '}
          <span key={area} className="inline-block animate-role-fade-in font-display italic text-text-primary">
            {FOCUS_AREAS[area]}
          </span>
        </p>

        <p className="blur-in mx-auto mb-12 max-w-md text-sm text-muted md:text-base">{meta.tagline}</p>

        <div className="blur-in inline-flex flex-wrap justify-center gap-4">
          <a
            href="#work"
            className="rounded-full bg-text-primary px-7 py-3.5 text-sm text-bg transition-transform hover:scale-105"
          >
            See work
          </a>
          <a
            href={PDF}
            download
            className="rounded-full border-2 border-stroke px-7 py-3.5 text-sm text-text-primary transition-transform hover:scale-105"
          >
            Download resume
          </a>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-center">
        <p className="mb-2 text-xs uppercase tracking-[0.2em] text-muted">Scroll</p>
        <span className="mx-auto block h-10 w-px overflow-hidden bg-stroke">
          <span className="accent-gradient block h-4 w-px animate-scroll-down" />
        </span>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- section head */

function Head({ eyebrow, lead, italic, sub }: { eyebrow: string; lead: string; italic: string; sub: string }) {
  return (
    <motion.div {...RISE} className="mb-10 md:mb-14">
      <div className="mb-5 flex items-center gap-3">
        <span className="h-px w-8 bg-stroke" />
        <span className="text-xs uppercase tracking-[0.3em] text-muted">{eyebrow}</span>
      </div>
      <h2 className="mb-3 text-3xl text-text-primary md:text-5xl">
        {lead} <span className="font-display italic">{italic}</span>
      </h2>
      <p className="max-w-xl text-sm text-muted md:text-base">{sub}</p>
    </motion.div>
  );
}

/* ---------------------------------------------------------------------- work */

function Work() {
  // The reference runs four cards at 7/5/5/7. There are three real projects, so
  // the row pattern is 7/5 then full width rather than a fourth invented one.
  const spans = ['md:col-span-7', 'md:col-span-5', 'md:col-span-12'];
  const ratios = ['aspect-[4/3]', 'aspect-[4/3]', 'aspect-[16/7]'];

  return (
    <section id="work" className="bg-bg py-16 md:py-24">
      <div className="mx-auto max-w-[1200px] px-6 md:px-10 lg:px-16">
        <Head
          eyebrow="Selected work"
          lead="Featured"
          italic="projects"
          sub="Three deliveries, each one traceable to the line of the resume it came from."
        />

        <div className="grid grid-cols-1 gap-5 md:grid-cols-12 md:gap-6">
          {PROJECTS.map((p, i) => (
            <motion.article
              {...RISE}
              transition={{ ...RISE.transition, delay: i * 0.08 }}
              key={p.name}
              className={`group relative overflow-hidden rounded-3xl border border-stroke bg-surface ${spans[i % spans.length]}`}
            >
              <div className={`relative ${ratios[i % ratios.length]} w-full overflow-hidden`}>
                <Cover
                  index={p.cover}
                  className="h-full w-full transition-transform duration-700 group-hover:scale-105"
                />
                {/* Halftone, at the reference's 4px pitch. */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-20 mix-blend-multiply"
                  style={{
                    backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
                    backgroundSize: '4px 4px',
                  }}
                />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-bg/70 opacity-0 backdrop-blur-lg transition-opacity duration-500 group-hover:opacity-100">
                  <span className="relative rounded-full">
                    <span
                      aria-hidden="true"
                      className="ring-gradient absolute animate-gradient-shift rounded-full"
                      style={{ inset: -2 }}
                    />
                    <span className="relative block rounded-full bg-white px-5 py-2 text-sm text-black">
                      View — <span className="font-display italic">{p.name}</span>
                    </span>
                  </span>
                </div>
              </div>

              <div className="p-6 md:p-7">
                <h3 className="mb-2 text-lg text-text-primary md:text-xl">{p.name}</h3>
                <p className="mb-3 max-w-2xl text-sm text-muted">{p.blurb}</p>
                <p className="mb-4 max-w-2xl text-sm text-text-primary/80">{p.impact}</p>
                <ul className="flex flex-wrap gap-2">
                  {p.tags.map((t) => (
                    <li key={t} className="rounded-full border border-stroke px-3 py-1 text-xs text-muted">
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------- method */

function Method() {
  return (
    <section id="method" className="bg-bg py-16 md:py-24">
      <div className="mx-auto max-w-[1200px] px-6 md:px-10 lg:px-16">
        {/* The reference has a journal here. There is no blog to link to, so the
            slot carries the five delivery stages instead -- same shape, real
            content. */}
        <Head
          eyebrow="How I work"
          lead="The delivery"
          italic="loop"
          sub="Five stages, each grounded in the verbs the resume actually uses."
        />

        <ol className="flex flex-col gap-4">
          {METHOD.map((m, i) => (
            <motion.li
              {...RISE}
              transition={{ ...RISE.transition, delay: i * 0.05 }}
              key={m.stage}
              className="flex flex-col gap-4 rounded-[40px] border border-stroke bg-surface/30 p-5 transition-colors hover:bg-surface sm:flex-row sm:items-center sm:gap-6 sm:rounded-full sm:p-4"
            >
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-stroke font-display text-xl italic text-text-primary">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base text-text-primary md:text-lg">{m.stage}</span>
                <span className="block text-sm text-muted">{m.blurb}</span>
              </span>
              <span className="hidden shrink-0 flex-wrap justify-end gap-2 lg:flex">
                {m.artifacts.map((a) => (
                  <span key={a} className="rounded-full border border-stroke px-3 py-1 text-xs text-muted">
                    {a}
                  </span>
                ))}
              </span>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- deliverables */

function Deliverables() {
  const section = useRef<HTMLElement>(null);
  const pinned = useRef<HTMLDivElement>(null);
  const colA = useRef<HTMLDivElement>(null);
  const colB = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    // Pinning and parallax are motion for its own sake; without them the two
    // columns simply scroll, which is a perfectly good gallery.
    if (still() || window.innerWidth < 768) return;
    const ctx = gsap.context(() => {
      ScrollTrigger.create({ trigger: section.current, start: 'top top', end: 'bottom bottom', pin: pinned.current, pinSpacing: false });
      gsap.to(colA.current, { yPercent: -12, ease: 'none', scrollTrigger: { trigger: section.current, start: 'top bottom', end: 'bottom top', scrub: 0.6 } });
      gsap.to(colB.current, { yPercent: -28, ease: 'none', scrollTrigger: { trigger: section.current, start: 'top bottom', end: 'bottom top', scrub: 0.6 } });
    }, section);
    return () => ctx.revert();
  }, []);

  const half = Math.ceil(DELIVERABLES.length / 2);
  const cols = [DELIVERABLES.slice(0, half), DELIVERABLES.slice(half)];

  return (
    <section ref={section} className="relative bg-bg py-16 md:min-h-[220vh] md:py-24">
      <div ref={pinned} className="z-10 mx-auto flex max-w-[1200px] flex-col items-center px-6 text-center md:h-screen md:justify-center">
        <div className="mb-5 flex items-center gap-3">
          <span className="h-px w-8 bg-stroke" />
          <span className="text-xs uppercase tracking-[0.3em] text-muted">What I produce</span>
        </div>
        <h2 className="mb-3 text-3xl text-text-primary md:text-5xl">
          The <span className="font-display italic">artefacts</span>
        </h2>
        <p className="max-w-md text-sm text-muted md:text-base">
          {DELIVERABLE_COUNT} types across {ROLE_COUNT} roles. Six of them here.
        </p>
      </div>

      <div className="relative z-20 mx-auto mt-12 grid max-w-[1400px] grid-cols-2 gap-6 px-6 md:mt-0 md:gap-40 md:px-10">
        {cols.map((col, ci) => (
          <div key={ci} ref={ci === 0 ? colA : colB} className={ci === 1 ? 'md:pt-52' : ''}>
            <div className="flex flex-col gap-6 md:gap-24">
              {col.map((d, i) => (
                <figure
                  key={d}
                  className="mx-auto w-full max-w-[320px] overflow-hidden rounded-3xl border border-stroke bg-surface"
                  style={{ transform: `rotate(${(ci ? 1 : -1) * (1.5 + i * 0.6)}deg)` }}
                >
                  <div className="aspect-square">
                    <DeliverableMark seed={ci * 3 + i} />
                  </div>
                  <figcaption className="border-t border-stroke p-4 text-xs text-muted sm:text-sm">{d}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------- stats */

function Stats() {
  return (
    <section className="bg-bg py-16 md:py-24">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-8 px-6 sm:grid-cols-3 md:px-10 lg:px-16">
        {STATS.map((s, i) => (
          <motion.div {...RISE} transition={{ ...RISE.transition, delay: i * 0.08 }} key={s.label} title={s.source}>
            <div className="font-display text-5xl italic text-text-primary md:text-7xl">
              {s.value}
              {s.suffix}
            </div>
            <div className="mt-2 text-sm text-text-primary/80">{s.label}</div>
            {/* The resume line the figure came from, on the page rather than in
                a tooltip: a number a reader cannot trace is a liability. */}
            <div className="mt-1 text-xs text-muted">{s.source}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------- contact */

function Contact() {
  const track = useRef<HTMLDivElement>(null);
  const [hot, setHot] = useState(false);

  useLayoutEffect(() => {
    if (still()) return;
    const ctx = gsap.context(() => {
      gsap.to(track.current, { xPercent: -50, duration: 40, ease: 'none', repeat: -1 });
    });
    return () => ctx.revert();
  }, []);

  return (
    <footer className="relative overflow-hidden bg-bg pb-8 pt-16 md:pb-12 md:pt-20">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-stroke" />

      <div className="mb-14 overflow-hidden md:mb-20" aria-hidden="true">
        <div ref={track} className="flex w-max whitespace-nowrap">
          {Array.from({ length: 10 }, (_, i) => (
            <span key={i} className="font-display text-4xl italic text-text-primary/25 md:text-6xl">
              {MARQUEE}&nbsp;•&nbsp;
            </span>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-6 text-center md:px-10 lg:px-16">
        <h2 className="mb-6 text-3xl text-text-primary md:text-5xl">
          Open to <span className="font-display italic">Business Analyst</span> roles
        </h2>
        <p className="mx-auto mb-8 max-w-md text-sm text-muted md:text-base">{meta.availability}.</p>

        <a
          href={MAILTO}
          onMouseEnter={() => setHot(true)}
          onMouseLeave={() => setHot(false)}
          className="relative inline-block rounded-full"
        >
          <Ring show={hot} />
          <span className="relative block rounded-full bg-text-primary px-8 py-4 text-sm text-bg">{meta.email}</span>
        </a>
      </div>

      <div className="mx-auto mt-16 flex max-w-[1200px] flex-col items-center gap-4 border-t border-stroke px-6 pt-8 text-xs text-muted sm:flex-row sm:justify-between md:px-10 lg:px-16">
        <ul className="flex gap-5">
          {SOCIALS.map((sLink) => (
            <li key={sLink.label}>
              <a href={sLink.href} className="transition-colors hover:text-text-primary" target="_blank" rel="noopener">
                {sLink.label}
              </a>
            </li>
          ))}
        </ul>
        <p className="flex items-center gap-2">
          <span className="relative grid h-2 w-2 place-items-center">
            <span className="absolute h-full w-full animate-ping rounded-full bg-emerald-400/60" />
            <span className="h-full w-full rounded-full bg-emerald-400" />
          </span>
          Available for projects
        </p>
      </div>
    </footer>
  );
}

/* ---------------------------------------------------------------------- page */

export default function Portfolio() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.documentElement.style.scrollBehavior = still() ? 'auto' : 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = '';
    };
  }, []);

  // The pinned gallery measures the page, so it has to re-measure once the
  // splash screen stops covering it.
  useEffect(() => {
    if (!loading) ScrollTrigger.refresh();
  }, [loading]);

  return (
    <div className="min-h-screen bg-bg font-body text-text-primary">
      {loading && <LoadingScreen onComplete={() => setLoading(false)} />}
      <Navbar />
      <main>
        <Hero />
        <Work />
        <Method />
        <Deliverables />
        <Stats />
      </main>
      <Contact />
    </div>
  );
}
