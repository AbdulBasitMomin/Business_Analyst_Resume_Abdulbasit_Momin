/**
 * Bootstrap.
 *
 * Resume content renders first and is complete before any WebGL exists. The
 * backdrop is an enhancement attached afterwards; if it fails, the page is
 * still a full resume.
 */
import { renderAll, initReveal, initCounters, initMagnetic, initScrollSync, initLitText } from './ui.js';
import { initRecruiterMode, initEvidence, initStoryLab } from './interactive.js';
import { initTrace, initTraceGraph } from './traceui.js';
import { initCards3D } from './cards3d.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

renderAll();
initReveal();
initLitText({ reducedMotion });
initCounters({ reducedMotion });
initMagnetic({ reducedMotion });
initRecruiterMode();
initEvidence();
initStoryLab();
// After the evidence chips and bullets exist, so the matrix can bind to them.
initTrace();
// After every card is rendered, since this binds to the cards themselves.
initCards3D({ reducedMotion });

let backdrop = null;

async function initThree() {
  try {
    const { createBackdrop } = await import('./backdrop.js');
    backdrop = createBackdrop(document.getElementById('bg-canvas'), { reducedMotion });

    window.addEventListener('resize', () => backdrop?.resize());
    window.addEventListener('pointermove',
      (e) => backdrop?.onPointerMove(e.clientX, e.clientY), { passive: true });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) backdrop?.stop();
      else backdrop?.start();
    });

    document.body.classList.add('has-webgl');
  } catch (err) {
    // Surfaced as an error, not a warning: a silent WebGL death once shipped
    // a flat page that looked intentional.
    console.error('Backdrop unavailable; resume content is unaffected.', err);
    document.body.classList.add('no-webgl');
  } finally {
    document.getElementById('loader').classList.add('is-done');
  }
}

initScrollSync((p) => backdrop?.setScroll(p));
initThree();
initTraceGraph({ reducedMotion });
