// Dev-only renderer used by scripts/thumbs.mjs to make food thumbnails,
// stage posters and social-share images from the same 3D models as the site.
import { createStage } from '../src/3d/scene.js';

const params = new URLSearchParams(location.search);
const mode = params.get('mode');

if (mode === 'thumbs') {
  const holder = document.getElementById('stage');
  holder.style.cssText = 'width:320px;height:320px';
  const stage = createStage(holder, { thumbnail: true, preserveDrawingBuffer: true, interactive: false });
  window.renderThumb = (id) => { stage.setFood(id, null); stage.render(); return stage.canvas.toDataURL('image/webp', 0.88); };
  document.body.dataset.ready = '1';
} else if (mode === 'stage') {
  const el = document.getElementById('stage');
  el.style.cssText = `width:${params.get('w') || 880}px;height:${params.get('h') || 600}px`;
  window.stage = createStage(el, { species: params.get('species'), food: params.get('food'), verdict: params.get('v'), preserveDrawingBuffer: true });
  if (params.get('settle')) window.stage.settle();
  window.snapshot = (q = 0.86) => window.stage.canvas.toDataURL('image/webp', q);
  document.body.dataset.ready = '1';
}
