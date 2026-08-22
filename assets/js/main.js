/**
 * Bootstrap.
 *
 * Content renders first, so the page is complete before any WebGL exists. The
 * 3D world and the interaction layer attach afterwards; a failure in either
 * leaves a fully readable resume behind.
 */
import { renderAll, initReveal, initCounters, initTilt, initMagnetic, initScrollSync } from './ui.js';
import { initRecruiterMode, initEvidence, initStoryLab, initBoard } from './interactive.js';
import { resume } from './data.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

renderAll();
initReveal();
initCounters({ reducedMotion });
initTilt({ reducedMotion });
initMagnetic({ reducedMotion });
initRecruiterMode();
initEvidence();
initStoryLab();
initBoard();

let journey = null;
let orb = null;

/** WebGL is an enhancement; never let it take the content down. */
async function initThree() {
  try {
    const [{ createJourney }, { createOrb }] = await Promise.all([
      import('./chapters.js'),
      import('./orb.js'),
    ]);

    journey = createJourney(document.getElementById('bg-canvas'), { reducedMotion });
    orb = createOrb(document.getElementById('orb-canvas'), resume.skills, { reducedMotion });

    window.addEventListener('resize', () => {
      journey?.resize();
      orb?.resize();
    });
    window.addEventListener('pointermove',
      (e) => journey?.onPointerMove(e.clientX, e.clientY), { passive: true });

    // Stop rendering entirely while the tab is hidden.
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { journey?.stop(); orb?.stop(); }
      else { journey?.start(); orb?.start(); }
    });

    document.body.classList.add('has-webgl');
  } catch (err) {
    console.warn('3D layer unavailable; content is unaffected.', err);
    document.body.classList.add('no-webgl');
  } finally {
    document.getElementById('loader').classList.add('is-done');
  }
}

initScrollSync((p) => journey?.setScroll(p));
initThree();
