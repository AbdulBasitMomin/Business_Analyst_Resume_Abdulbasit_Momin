import { useState } from 'react';
import { Play, Menu, X } from 'lucide-react';

const NAV_LINKS = ['ABOUT', 'PROCESS', 'PROJECTS', 'CATALOG', 'D.O.T', 'TALK'];

const SERVICES = [
  'Branding',
  'Creative Direction & Strategy',
  'UX/UI Design',
  'Web Development (React/Nextjs)',
  '3D, WebGL / Photography',
  'Video & Animation',
];

const AWARDS = [
  { name: 'FWA', count: 'x1', nameClass: 'font-bold text-sm sm:text-base tracking-tight' },
  { name: 'W.', count: 'x7', nameClass: 'font-bold text-lg sm:text-xl' },
  { name: 'CSSDesignAwards', count: 'x22', nameClass: 'font-bold text-[10px] sm:text-xs tracking-tight' },
];

// The Grilled Pixels mark. Inlined rather than fetched so it paints with the
// first frame -- it sits in the navbar, which is the topmost thing on screen.
function Logo() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 256 256" fill="none">
      <path
        d="M 160 88 L 194 34 L 216 0 L 256 0 L 256 40 L 221.5 93.5 L 200 128 L 256 128 L 256 256 L 96 256 L 96 168 L 64.246 220 L 40 256 L 0 256 L 0 216 L 34 162 L 56 128 L 0 128 L 0 0 L 160 0 Z"
        fill="white"
      />
    </svg>
  );
}

// The two headline words that break out of Inter into the bitmap face. 1.25em
// keeps them optically level with the Inter caps around them, which sit on a
// larger body relative to their cap height.
const PIXEL_WORD = 'font-pixel font-normal text-[1.25em] inline-block leading-none align-baseline';

const META_LABEL = 'text-base tracking-widest text-white/50 uppercase mb-3 font-pixel';

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black text-white">
      {/* No dark overlay: the copy is white straight onto the footage. */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-cover lg:scale-[1.2]"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260725_114042_d2ed2a89-f2fa-449b-9609-da456344257b.mp4"
      />

      <div className="relative z-10 flex h-full flex-col px-5 sm:px-6 md:px-10 lg:px-14">
        {/* ---- Navbar ---- */}
        <nav className="flex items-center justify-between py-6">
          <Logo />

          <div className="hidden md:flex items-center gap-8 text-sm tracking-wide">
            {NAV_LINKS.map((link) => (
              <a key={link} href="#" className="hover:opacity-70 transition-opacity">
                {link}
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

        {/* ---- Four-column meta grid ---- */}
        <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {/* 1. Name + brand note */}
          <div>
            <h2 className="text-lg md:text-xl tracking-wide leading-tight">
              <span className="block font-normal">ADAM</span>
              <span className="block font-pixel text-2xl md:text-3xl">ROBERTS</span>
            </h2>
            <div className="text-[10px] text-white/50 mt-3">*</div>
            <p className="font-pixel mt-1 text-xs text-white/60 leading-relaxed">
              Grilled Pixels is my
              <br />
              personal brand - I came up
              <br />
              with it in 2004 based on
              <br />
              "cooking up ideas"
            </p>
          </div>

          {/* 2. Discipline */}
          <div className="text-right lg:text-left">
            <h2 className="text-lg md:text-xl tracking-wide leading-tight">
              <span className="block font-normal">DESIGN &amp;</span>
              <span className="block font-pixel text-2xl md:text-3xl">ENGINEERING</span>
            </h2>
          </div>

          {/* 3. What I Do */}
          <div>
            <div className={META_LABEL}>What I Do</div>
            <p className="text-sm text-white/90 leading-relaxed max-w-[220px]">
              I create the top 1% of experiences for brands and digital products
            </p>
          </div>

          {/* 4. Services */}
          <div className="text-right lg:text-left">
            <div className={META_LABEL}>Services</div>
            <ul className="text-sm text-white/90 leading-relaxed space-y-0.5">
              {SERVICES.map((service) => (
                <li key={service}>{service}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Holds the block below against the bottom of the viewport. */}
        <div className="flex-1" />

        {/* ---- Bottom block ---- */}
        <div className="pb-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-end">
            {/* 0.72 leading is tighter than any Tailwind step and is the whole
                look of the headline -- the lines interlock rather than stack. */}
            <h1
              className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.75rem] xl:text-[4.25rem] tracking-wide uppercase font-normal"
              style={{ lineHeight: 0.72 }}
            >
              I BRING THE
              <br />
              <span className={PIXEL_WORD}>UNEXPECTED</span> TO
              <br />
              BRAND &amp; DIGITAL
              <br />
              <span className={PIXEL_WORD}>EXPERIENCES</span>
            </h1>

            <div className="flex flex-col gap-4 sm:gap-6 justify-end">
              <button
                type="button"
                className="self-start flex items-center gap-3 border border-white/30 px-6 py-3 backdrop-blur-sm bg-white/5 hover:bg-white/10 transition-colors"
              >
                <Play size={14} fill="white" />
                <span className="text-sm tracking-wider">PLAY SHOWREEL</span>
              </button>

              <div className="self-start lg:self-end flex flex-wrap items-stretch gap-2 sm:gap-3 text-sm text-white/80">
                {AWARDS.map((award) => (
                  <div key={award.name} className="bg-[#0B0B0B] px-3 sm:px-4 py-2 flex items-center gap-2">
                    <span className={award.nameClass}>{award.name}</span>
                    <span className="text-white/50 text-xs">{award.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 sm:mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 pt-4">
            <div className="text-xs text-white/60">
              Open to freelance, contract or full-time.{' '}
              <a href="#" className="text-red-500 hover:text-red-400 transition-colors">
                Schedule a call
              </a>
            </div>
            <div className="text-xs text-white/60 sm:text-right">
              5 full cases &bull; 82 archive fragments &bull; 22 catalog items
            </div>
          </div>
        </div>
      </div>

      {/* ---- Mobile menu ---- */}
      <div
        className={`fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-6">
          <Logo />
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
          {NAV_LINKS.map((link, i) => (
            <a
              key={link}
              href="#"
              onClick={() => setMenuOpen(false)}
              // Staggered only on the way in. Closing runs every link at once,
              // otherwise the overlay fades out from under a still-animating list.
              style={{ transitionDelay: menuOpen ? `${100 + i * 60}ms` : '0ms' }}
              className={`text-2xl tracking-widest transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                menuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              {link}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
}
