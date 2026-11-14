export interface GNode { id: string; label: string; x: number; y: number; degree: number }

/** Small deterministic force layout — enough for a personal garden of a few hundred notes. */
export function layoutGraph(nodes: { id: string; label: string }[], edges: { from: string; to: string }[], w = 800, h = 520): GNode[] {
  const n = nodes.length;
  if (!n) return [];
  const idx = new Map(nodes.map((x, i) => [x.id, i]));
  const deg = new Array(n).fill(0);
  const E = edges.map((e) => [idx.get(e.from), idx.get(e.to)]).filter((p): p is [number, number] => p[0] !== undefined && p[1] !== undefined);
  E.forEach(([a, b]) => { deg[a]++; deg[b]++; });
  const cx = w / 2, cy = h / 2;
  const P = nodes.map((_, i) => {
    const a = (i / n) * Math.PI * 2;
    const r = Math.min(w, h) * 0.35;
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
  });
  const k = Math.sqrt((w * h) / n) * 0.55;
  for (let it = 0; it < 320; it++) {
    const t = 1 - it / 320;
    const D = P.map(() => ({ x: 0, y: 0 }));
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const dx = P[i].x - P[j].x, dy = P[i].y - P[j].y;
      const d2 = Math.max(dx * dx + dy * dy, 0.01);
      const f = (k * k) / d2;
      D[i].x += dx * f; D[i].y += dy * f; D[j].x -= dx * f; D[j].y -= dy * f;
    }
    for (const [a, b] of E) {
      const dx = P[a].x - P[b].x, dy = P[a].y - P[b].y;
      const d = Math.max(Math.sqrt(dx * dx + dy * dy), 0.01);
      const f = d / k;
      D[a].x -= dx * f; D[a].y -= dy * f; D[b].x += dx * f; D[b].y += dy * f;
    }
    for (let i = 0; i < n; i++) {
      D[i].x += (cx - P[i].x) * 0.04 * (deg[i] ? 1 : 2);
      D[i].y += (cy - P[i].y) * 0.04 * (deg[i] ? 1 : 2);
      const len = Math.sqrt(D[i].x ** 2 + D[i].y ** 2) || 1;
      const step = Math.min(len, 22 * t + 1);
      P[i].x = Math.min(w - 60, Math.max(60, P[i].x + (D[i].x / len) * step));
      P[i].y = Math.min(h - 30, Math.max(30, P[i].y + (D[i].y / len) * step));
    }
  }
  return nodes.map((x, i) => ({ ...x, x: P[i].x, y: P[i].y, degree: deg[i] }));
}
