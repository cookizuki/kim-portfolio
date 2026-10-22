// A finite canvas animation; no WebGL context or permanent render loop.
export function portraitFlight(image, overlay) {
  const canvas = document.createElement('canvas');
  canvas.className = 'intro-pixels'; canvas.setAttribute('aria-hidden', 'true');
  overlay.prepend(canvas);
  const ctx = canvas.getContext('2d');
  let frame = 0, cancelled = false;
  const started = performance.now();
  const stop = () => { cancelled = true; cancelAnimationFrame(frame); canvas.remove(); };
  if (!ctx) return stop;
  const w = innerWidth, h = innerHeight, dpr = Math.min(devicePixelRatio || 1, 1.5);
  canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
  ctx.scale(dpr, dpr);
  const clamp = n => Math.max(0, Math.min(1, n));
  const ease = n => n * n * (3 - 2 * n);
  const mix = (a,b,t) => a + (b-a)*t;
  const render = () => {
    if (cancelled) return;
    const r = image.getBoundingClientRect();
    const ratio = image.naturalWidth / image.naturalHeight;
    // Match the hero's object-fit:contain / object-position:center top.
    const tw = Math.min(r.width, r.height * ratio), th = tw / ratio;
    const tx = r.left + (r.width-tw)/2, ty = r.top;
    const sw = Math.min(270, w * .52, h * .38), sh = sw/ratio;
    const sx = (w-sw)/2, sy = (h-sh)/2;
    const cols = w < 700 ? 22 : 32, rows = Math.round(cols/ratio);
    const tileW = image.naturalWidth/cols, tileH = image.naturalHeight/rows;
    function tick(now) {
      if (cancelled) return;
      try {
        const t = now-started;
        ctx.clearRect(0,0,w,h);
        if (t > 2700) { stop(); return; }
        const appear = ease(clamp((t-650)/280));
        const travel = ease(clamp((t-1150)/1250));
        const scatter = Math.sin(Math.PI * travel);
        ctx.globalAlpha = appear * (1-clamp((t-2400)/250));
        for(let y=0;y<rows;y++) for(let x=0;x<cols;x++) {
          const seed = Math.sin(x*127.1+y*311.7)*43758.5453;
          const rand = seed-Math.floor(seed);
          const angle = rand*Math.PI*2;
          const distance = (35+rand*Math.min(w*.3,240))*scatter;
          const px = mix(sx+x/cols*sw, tx+x/cols*tw,travel)+Math.cos(angle)*distance;
          const py = mix(sy+y/rows*sh, ty+y/rows*th,travel)+Math.sin(angle)*distance;
          const dw = mix(sw,tw,travel)/cols, dh = mix(sh,th,travel)/rows;
          // Match the portrait's soft bottom edge while preserving transparency.
          ctx.globalAlpha = appear*(1-clamp((t-2400)/250))*(1-clamp((y/rows-.86)/.14));
          ctx.drawImage(image,x*tileW,y*tileH,tileW,tileH,px,py,dw+.3,dh+.3);
        }
        frame = requestAnimationFrame(tick);
      } catch { stop(); }
    }
    frame = requestAnimationFrame(tick);
  };
  if (image.complete && image.naturalWidth) render();
  else image.decode().then(render).catch(stop);
  return stop;
}
