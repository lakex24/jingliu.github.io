/**
 * The deck viewer for /startups/equity/: one slide per moment on the timeline across the top. Turn
 * pages with the timeline, the arrow keys, a swipe or the arrows; full screen on request. The current slide lives in `?s=<id>` (replaced, not
 * pushed, so Back leaves the page). Rendered as a React island (client:load) — the rest of the site
 * stays static.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { EQUITY_DECK, TimelineStrip } from './EquityDeck';

const slides = EQUITY_DECK;
const indexOf = (id: string | null) => Math.max(0, slides.findIndex((s) => s.id === id));

export default function EquityDeckApp() {
  const [idx, setIdx] = useState(0);
  const frame = useRef<HTMLDivElement>(null);
  const first = useRef(true);

  // Start on the slide named in the URL, and follow Back/Forward within the page.
  useEffect(() => {
    const read = () => setIdx(indexOf(new URLSearchParams(location.search).get('s')));
    read(); addEventListener('popstate', read); return () => removeEventListener('popstate', read);
  }, []);

  const goTo = useCallback((i: number) => {
    if (i < 0 || i >= slides.length) return;
    setIdx(i);
    const u = new URL(location.href);
    if (i === 0) u.searchParams.delete('s'); else u.searchParams.set('s', slides[i].id);
    history.replaceState(history.state, '', u);
  }, []);
  const nav = useCallback((id: string) => goTo(indexOf(id)), [goTo]);
  const step = useCallback((dir: 1 | -1) => goTo(idx + dir), [goTo, idx]);

  // ← → (and PageUp/PageDown, space) turn pages, except while a slider or field has the keyboard.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) { e.preventDefault(); step(1); }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); step(-1); }
    };
    addEventListener('keydown', onKey); return () => removeEventListener('keydown', onKey);
  }, [step]);

  // A horizontal swipe turns the page; a drag that starts on a slider or a wide table does not.
  const touch = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const el = e.target as HTMLElement;
    touch.current = el.closest('input, .eq-table-wrap') ? null : { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const t = touch.current; touch.current = null; if (!t) return;
    const dx = e.changedTouches[0].clientX - t.x, dy = e.changedTouches[0].clientY - t.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
  };
  // A new page starts at its top (not on first load: the reader may have scrolled to the deck).
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const el = frame.current; if (!el) return;
    if (document.fullscreenElement === el) el.scrollTo({ top: 0 });
    else if (el.getBoundingClientRect().top < 0) el.scrollIntoView({ block: 'start' });
  }, [idx]);

  const fullscreen = () => { const el = frame.current; if (!el) return; if (document.fullscreenElement) void document.exitFullscreen(); else void el.requestFullscreen?.(); };
  const slide = slides[idx];

  return (
    <div className="sl-deck eqd" lang="zh">
      <div className="sl-head">
        <span className="sl-deckname">一家公司的股票</span>
        <span className="muted sl-count">{idx + 1} / {slides.length}</span>
        <button type="button" className="iconbtn sl-fs" onClick={fullscreen} title="全屏" aria-label="全屏">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
        </button>
      </div>
      <div ref={frame} className="sl-frame" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <TimelineStrip slideId={slide.id} nav={nav} />
        <article key={slide.id} className="sl-slide" aria-label={`${idx + 1}. ${slide.title}`}>
          {slide.render()}
        </article>
        <nav className="sl-nav" aria-label="翻页">
          <button type="button" className="sl-arrow" onClick={() => step(-1)} disabled={idx === 0} aria-label="上一页">←</button>
          <span className="sl-where">{slide.title}</span>
          <button type="button" className="sl-arrow" onClick={() => step(1)} disabled={idx === slides.length - 1} aria-label="下一页">→</button>
        </nav>
      </div>
    </div>
  );
}
