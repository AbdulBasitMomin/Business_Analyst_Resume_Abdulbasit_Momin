/**
 * 3D cards.
 *
 * A card turns towards the pointer, a specular highlight tracks across its
 * face, and the elements on the face sit at their own depths so the parallax
 * is real rather than a flat image being skewed.
 *
 * Three rules this is built to, in order:
 *
 *   1. The text wins. Rotation is capped at a few degrees, because past that
 *      the type on the face starts to read as distorted, and a transform costs
 *      subpixel antialiasing while it is applied. Nothing is transformed at
 *      rest.
 *   2. Pointers only. There is no hover on a touch screen, so a tilt there
 *      either never fires or fires on a tap and sticks. Phones get the flat
 *      card, which is the same card.
 *   3. One listener, one frame. Per-card pointermove handlers on twenty cards
 *      is twenty handlers competing for the same frame; this reads the pointer
 *      once per frame and writes only to the card under it.
 */

const SELECTOR = '.proj, .outcome, .stat, .ask-card, .case-note';
const MAX_TILT = 5.5;   // degrees

export function initCards3D({ reducedMotion = false } = {}) {
  const cards = [...document.querySelectorAll(SELECTOR)];
  if (!cards.length) return;

  // The class is what the stylesheet hangs the material on, so it goes on
  // regardless: a phone gets the card, just not the tilt.
  cards.forEach((c) => c.classList.add('card3d'));

  const canTilt = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    && window.matchMedia('(min-width: 860px)').matches;
  if (reducedMotion || !canTilt) return;

  let active = null;
  let pending = null;
  let frame = 0;

  const apply = () => {
    frame = 0;
    if (!pending) return;
    const { card, x, y } = pending;
    pending = null;
    const r = card.getBoundingClientRect();
    // Normalised to [-1, 1] from the centre of the card.
    const nx = (x - (r.left + r.width / 2)) / (r.width / 2);
    const ny = (y - (r.top + r.height / 2)) / (r.height / 2);
    // Turning towards the pointer means the far edge drops: y drives rotateX
    // negatively, x drives rotateY positively.
    card.style.setProperty('--rx', `${(-ny * MAX_TILT).toFixed(2)}deg`);
    card.style.setProperty('--ry', `${(nx * MAX_TILT).toFixed(2)}deg`);
    card.style.setProperty('--mx', `${(((x - r.left) / r.width) * 100).toFixed(1)}%`);
    card.style.setProperty('--my', `${(((y - r.top) / r.height) * 100).toFixed(1)}%`);
  };

  const release = (card) => {
    card.classList.remove('is-tilting');
    // A frame queued before the release would otherwise land on a card that is
    // no longer tracking, leaving stale values for the next hover to flash.
    if (frame) { cancelAnimationFrame(frame); frame = 0; }
    pending = null;
    // Cleared rather than zeroed, so the CSS defaults take the card home and
    // the transition on .card3d plays.
    ['--rx', '--ry', '--mx', '--my'].forEach((v) => card.style.removeProperty(v));
    // Leave no empty style attribute behind.
    if (!card.getAttribute('style')) card.removeAttribute('style');
  };

  // One document-level listener. Leaving a card and entering the next is a
  // single move event, which is also why the handoff is handled here.
  document.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const card = e.target.closest(SELECTOR);
    if (card !== active) {
      if (active) release(active);
      active = card;
      if (card) card.classList.add('is-tilting');
    }
    if (!card) return;
    pending = { card, x: e.clientX, y: e.clientY };
    if (!frame) frame = requestAnimationFrame(apply);
  }, { passive: true });

  // The pointer can leave the window without a move event over anything else.
  document.addEventListener('pointerleave', () => {
    if (active) { release(active); active = null; }
  });
  window.addEventListener('blur', () => {
    if (active) { release(active); active = null; }
  });
  // A scroll moves the card out from under a stationary pointer, which would
  // otherwise leave it tilted at an angle that no longer points anywhere.
  window.addEventListener('scroll', () => {
    if (active) { release(active); active = null; }
  }, { passive: true });
}
