const COLORS = ['#3A8DDE', '#6BCF7A', '#f59e0b', '#8b5cf6', '#ef4444', '#6FB2F2', '#8FE388'];

interface Piece {
  x: number; y: number;
  vx: number; vy: number;
  gravity: number;
  color: string;
  w: number; h: number;
  rotation: number;
  rotSpeed: number;
  alpha: number;
  shape: 'rect' | 'circle';
}

export function launchConfetti(originX?: number, originY?: number) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9998';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d')!;
  const W = (canvas.width  = window.innerWidth);
  const H = (canvas.height = window.innerHeight);

  const ox = originX ?? W / 2;
  const oy = originY ?? H * 0.35;

  const pieces: Piece[] = Array.from({ length: 90 }, () => {
    const angle = (Math.random() - 0.5) * Math.PI;
    const speed = Math.random() * 10 + 4;
    return {
      x: ox, y: oy,
      vx: Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1),
      vy: -(Math.random() * 10 + 4),
      gravity: 0.28 + Math.random() * 0.12,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      w: Math.random() * 8 + 5,
      h: Math.random() * 4 + 3,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 9,
      alpha: 1,
      shape: Math.random() > 0.7 ? 'circle' : 'rect',
    };
  });

  let raf: number;

  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    let alive = false;

    for (const p of pieces) {
      p.vy    += p.gravity;
      p.x     += p.vx;
      p.y     += p.vy;
      p.vx    *= 0.99;
      p.rotation += p.rotSpeed;
      p.alpha -= 0.014;

      if (p.alpha <= 0 || p.y > H + 20) continue;
      alive = true;

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;

      if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      }
      ctx.restore();
    }

    if (alive) {
      raf = requestAnimationFrame(draw);
    } else {
      canvas.remove();
      cancelAnimationFrame(raf);
    }
  };

  raf = requestAnimationFrame(draw);
}
