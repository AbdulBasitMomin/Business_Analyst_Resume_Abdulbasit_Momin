/**
 * Bootstrap: render content first (so the page is readable even if WebGL is
 * unavailable), then attach the 3D layers progressively.
 */
import { resume, isPlaceholder } from './data.js';
import { renderAll, initReveal, initBars, initCounters, initTilt, initScrollSync } from './ui.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

renderAll(resume, { isPlaceholder });
initReveal();
initBars();
initCounters({ reducedMotion });
initTilt({ reducedMotion });

let scene = null;
let orb = null;

/** WebGL is an enhancement -- a failure here must not take the content down. */
async function initThree() {
  try {
    const [{ createScene }, { createOrb }] = await Promise.all([
      import('./scene.js'),
      import('./orb.js'),
    ]);

    scene = createScene(document.getElementById('bg-canvas'), { reducedMotion });
    orb = createOrb(document.getElementById('orb-canvas'), resume.skillCloud, { reducedMotion });

    window.addEventListener('resize', () => {
      scene?.resize();
      orb?.resize();
    });

    window.addEventListener(
      'pointermove',
      (e) => scene?.onPointerMove(e.clientX, e.clientY),
      { passive: true }
    );

    // Stop rendering entirely while the tab is hidden.
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        scene?.stop();
        orb?.stop();
      } else {
        scene?.start();
        orb?.start();
      }
    });

    document.body.classList.add('has-webgl');
  } catch (err) {
    console.warn('3D layer unavailable, falling back to flat background.', err);
    document.body.classList.add('no-webgl');
  } finally {
    document.getElementById('loader').classList.add('is-done');
  }
}

initScrollSync((progress) => scene?.setScroll(progress));
initThree();
