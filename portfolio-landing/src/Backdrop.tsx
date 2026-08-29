import { useEffect, useRef } from 'react';
import { createWorkspace, type Layout, type Workspace } from './workspace';

/**
 * Mounts the workspace scene behind the page.
 *
 * Three things this deliberately does not do: run while the tab is hidden,
 * animate for a reader who has asked for reduced motion (it renders one static
 * frame instead, so the composition is still there), or throw if WebGL is
 * missing (the page is legible on plain black).
 */
export default function Backdrop({ layout = 'side', dim = false }: { layout?: Layout; dim?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let scene: Workspace | null = null;
    try {
      scene = createWorkspace(canvas, layout);
    } catch {
      scene = null;
    }
    if (!scene) return;
    const view = scene;

    const size = () => {
      const { clientWidth: w, clientHeight: h } = canvas;
      if (w && h) view.resize(w, h);
    };
    size();

    const still = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onResize = () => {
      size();
      if (still.matches) view.frame(0);
    };
    window.addEventListener('resize', onResize);

    const onPointer = (e: PointerEvent) => {
      view.point((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
    };

    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      view.frame((now - start) / 1000);
      raf = requestAnimationFrame(tick);
    };

    const run = () => {
      cancelAnimationFrame(raf);
      if (still.matches || document.hidden) {
        view.frame(0);
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    // Pointer parallax is motion too, so it goes on and off with the loop.
    const sync = () => {
      window.removeEventListener('pointermove', onPointer);
      if (!still.matches) window.addEventListener('pointermove', onPointer, { passive: true });
      run();
    };
    sync();

    document.addEventListener('visibilitychange', run);
    still.addEventListener('change', sync);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointer);
      document.removeEventListener('visibilitychange', run);
      still.removeEventListener('change', sync);
      view.dispose();
    };
  }, [layout]);

  return (
    <>
      {/* Held back below lg. The stacked layout leaves the scene nowhere to go
          that is not behind a line of text, and measured against the composited
          frame the meta grid drops to 1.8:1 over it at full strength. */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 h-full w-full ${dim ? 'opacity-25' : 'opacity-25 lg:opacity-100'}`}
        aria-hidden="true"
      />
      {/* Scrims over the two bands the copy occupies -- the meta grid along the
          top, the headline and footer along the bottom -- leaving the middle of
          the frame, where the laptop is, at full strength.

          This is deliberately a band rather than a set of per-breakpoint
          nudges. Moving the rig to dodge a specific collision only holds until
          a window size nobody measured puts a bright edge behind a different
          line; attenuating the region the text lives in holds at every size.
          Measured over the composited frame, the top band was dropping 14px
          copy to 3.0:1 without it. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.86) 0%, rgba(0,0,0,0.55) 24%, transparent 44%),' +
            'linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.3) 18%, transparent 40%),' +
            'radial-gradient(130% 95% at 62% 46%, transparent 0%, transparent 46%, rgba(0,0,0,0.5) 100%)',
        }}
      />
    </>
  );
}
